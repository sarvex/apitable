import { ConfigConstant, Selectors, Strings, t } from '@vikadata/core';
import { ComponentDisplay, ScreenSize } from 'pc/components/common/component_display';
import { useThemeColors } from '@vikadata/components';
import { useState } from 'react';
import * as React from 'react';
import { DragDropContext, Draggable, Droppable, DropResult, ResponderProvided } from 'react-beautiful-dnd';
import { useSelector } from 'react-redux';
import IconDelete from 'static/icon/common/common_icon_delete.svg';
import styles from '../style.module.less';
import { ViewFieldOptions } from '../view_field_options';
import { ViewFieldOptionsMobile } from '../view_field_options/view_field_options_mobile';
import { ViewRules } from '../view_rules';
import { ButtonPlus } from 'pc/components/common';
import { Col, Row } from 'antd';
import { DragOutlined } from '@vikadata/icons';
import { InvalidValue } from 'pc/components/tool_bar/view_filter/invalid_value';

interface ICommonViewSetProps {
  onDragEnd(result: DropResult, provided: ResponderProvided): void;
  dragData: { fieldId: string; desc: boolean }[];
  setField(index: number, fieldId: string): void;
  existFieldIds: string[];
  setRules(index: number, desc: boolean): void;
  deleteItem(index: number): void;
  invalidFieldIds?: string[];
  invalidTip?: string;
}

export const CommonViewSet: React.FC<ICommonViewSetProps> = props => {
  const colors = useThemeColors();
  const { onDragEnd: propDragEnd, dragData, setField, existFieldIds, setRules, deleteItem, invalidFieldIds = [], invalidTip } = props;
  const [disableDrag, setDisableDrag] = useState(true);
  const fieldPermissionMap = useSelector(Selectors.getFieldPermissionMap);
  const fieldMap = useSelector(state => Selectors.getFieldMap(state, state.pageParams.datasheetId!));

  function onMouseOver() {
    setDisableDrag(false);
  }

  function onDragEnd(result: DropResult, provided: ResponderProvided) {
    propDragEnd(result, provided);
    setDisableDrag(false);
  }

  function fieldSettingItem(index: number) {
    if (!fieldMap) {
      return;
    }
    const fieldId = dragData[index].fieldId;
    // 检查是否有效
    const isInvalid = invalidFieldIds.some(di => di === fieldId);
    const isCryptoField = Selectors.getFieldRoleByFieldId(fieldPermissionMap, fieldId) === ConfigConstant.Role.None;
    const fieldNotFound = !isCryptoField && !fieldMap[fieldId];
    return (
      <>
        <ComponentDisplay minWidthCompatible={ScreenSize.md}>
          <div className={styles.iconDrag} onMouseOver={onMouseOver}>
            <DragOutlined size={10} color={colors.fourthLevelText} />
          </div>
          {/* 选项列表 */}
          <ViewFieldOptions
            index={index}
            onChange={setField.bind(null, index)}
            existFieldIds={existFieldIds}
            defaultFieldId={fieldId}
            isCryptoField={isCryptoField}
            fieldNotFound={fieldNotFound}
          />
          {/* 排序规则 */}
          {isCryptoField || fieldNotFound ? (
            <InvalidValue style={{ marginLeft: 20, maxWidth: 185 }} content={fieldNotFound ? t(Strings.current_field_fail) : undefined} />
          ) : (
            <ViewRules index={index} onChange={setRules.bind(null, index)} rulesItem={dragData[index]} invalid={isInvalid} invalidTip={invalidTip} />
          )}

          <ButtonPlus.Icon
            onClick={() => deleteItem(index)}
            size="x-small"
            style={{ color: colors.fourthLevelText, marginLeft: 10 }}
            icon={<IconDelete width={15} height={15} fill={colors.fourthLevelText} />}
          />
        </ComponentDisplay>

        <ComponentDisplay maxWidthCompatible={ScreenSize.md}>
          <Row align="middle" gutter={[0, 8]} style={{ width: '100%' }} onTouchMove={onMouseOver}>
            <Col span={1}>
              <div className={styles.iconDrag}>
                <DragOutlined size={10} color={colors.thirdLevelText} />
              </div>
            </Col>
            <Col span={9}>
              <div className={styles.optionsWrapper}>
                <ViewFieldOptionsMobile
                  onChange={setField.bind(null, index)}
                  existFieldIds={existFieldIds}
                  defaultFieldId={fieldId}
                  isCryptoField={isCryptoField}
                  fieldNotFound={fieldNotFound}
                />
              </div>
            </Col>
            <Col span={12}>
              {/* 排序规则 */}
              {isCryptoField || fieldNotFound ? (
                <InvalidValue style={{ marginLeft: 20, maxWidth: 185 }} content={fieldNotFound ? t(Strings.current_field_fail) : undefined} />
              ) : (
                <ViewRules
                  index={index}
                  onChange={setRules.bind(null, index)}
                  rulesItem={dragData[index]}
                  invalid={isInvalid}
                  invalidTip={invalidTip}
                />
              )}
            </Col>
            <Col span={2}>
              <div className={styles.delBtnWrapper}>
                <ButtonPlus.Icon
                  onClick={() => deleteItem(index)}
                  size="x-small"
                  style={{ color: colors.fourthLevelText }}
                  icon={<IconDelete width={15} height={15} fill={colors.fourthLevelText} />}
                />
              </div>
            </Col>
          </Row>
        </ComponentDisplay>
      </>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="common-view-set" direction="vertical">
        {provided => {
          return (
            <div className={styles.droppable} ref={provided.innerRef} {...provided.droppableProps}>
              {dragData.map((item, index) => {
                return (
                  <Draggable draggableId={item.fieldId + index} index={index} key={index} isDragDisabled={disableDrag}>
                    {providedChild => (
                      <div
                        className={styles.draggable}
                        ref={providedChild.innerRef}
                        {...providedChild.draggableProps}
                        {...providedChild.dragHandleProps}
                      >
                        {fieldSettingItem(index)}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          );
        }}
      </Droppable>
    </DragDropContext>
  );
};
