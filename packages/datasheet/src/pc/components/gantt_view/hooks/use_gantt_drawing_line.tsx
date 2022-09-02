import { useContext, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { KonvaGridContext } from 'pc/components/konva_grid';
import { resourceService } from 'pc/resource_service';
import { store } from 'pc/store';
import { KonvaGridViewContext } from 'pc/components/konva_grid/context';
import { PointPosition, KonvaGanttViewContext, GanttCoordinate, IScrollState, generateTargetName } from 'pc/components/gantt_view';
import { CollaCommandName, Selectors, KONVA_DATASHEET_ID, ConfigConstant, t, Strings, fastCloneDeep } from '@vikadata/core';
import { Message } from '@vikadata/components';
import { getAllCycleDAG, getTaskLineName } from 'pc/components/gantt_view/utils/task_line';
import { onDragScrollSpacing } from 'pc/components/gantt_view/utils';

const Arrow = dynamic(() => import('pc/components/gantt_view/hooks/use_gantt_timeline/arrow'), { ssr: false });
const Group = dynamic(() => import('pc/components/gantt_view/hooks/use_gantt_timeline/group'), { ssr: false });
const Circle = dynamic(() => import('pc/components/gantt_view/hooks/use_gantt_timeline/circle'), { ssr: false });

interface IDrawingLineProps {
  instance: GanttCoordinate;
  taskMap: any;
  gridWidth: number;
  pointPosition: PointPosition;
  scrollState: IScrollState;
}

export const useGanttDrawingLine = (props: IDrawingLineProps) => {
  const { taskMap, gridWidth, pointPosition, instance, scrollState } = props;
  const { theme, scrollHandler } = useContext(KonvaGridContext);
  const colors = theme.color;
  const { setTargetTaskInfo, targetTaskInfo, ganttStyle, transformerId, isTaskLineDrawing, dragTaskId, isLocking, linkCycleEdges } = useContext(
    KonvaGanttViewContext,
  );
  const { snapshot, fieldPermissionMap, fieldMap } = useContext(KonvaGridViewContext);
  const { linkFieldId, startFieldId, endFieldId } = ganttStyle;
  const state = store.getState();
  const { rowHeight, columnWidth } = instance;
  const arrowRef = useRef<any>();
  const [drawingLinePoints, setDrawingLinePoints] = useState<number[]>([]);

  const { x: pointX, y: pointY } = pointPosition;

  const circle1Ref = useRef<any>();
  const circle2Ref = useRef<any>();
  const taskBlock = useRef<any>();

  const setLinePointStyle = (radius: number, color: string) => {
    if (isTaskLineDrawing || !circle1Ref.current || !circle2Ref.current) {
      return;
    }
    circle1Ref.current.fill(color);
    circle1Ref.current.radius(radius * 2);
    circle2Ref.current.fill(color);
    circle2Ref.current.radius(radius);
    circle2Ref.current.strokeWidth(radius);
  };

  const linkField = fieldMap[linkFieldId];

  if (!transformerId || dragTaskId || !linkField || isLocking || !startFieldId || !endFieldId) {
    return {
      drawingLine: null,
    };
  }
  const sourceRecordId = isTaskLineDrawing ? taskBlock.current.id : transformerId.split('-')[1];

  if (!taskMap[sourceRecordId] && !isTaskLineDrawing) {
    return {
      drawingLine: null,
    };
  }

  if (!isTaskLineDrawing) {
    taskBlock.current = {
      info: taskMap[sourceRecordId],
      id: sourceRecordId,
    };
  }

  const { x: taskX, y: taskY, taskWidth } = taskBlock.current.info || taskMap[sourceRecordId];

  const x = taskWidth > columnWidth ? taskX + taskWidth - 16 : taskX + columnWidth - 16;
  const y = taskY + rowHeight - 4;

  // 计算当前鼠标位置在哪个task内
  const includeTask = (targetX: number, targetY: number) => {
    let res = '';
    Object.keys(taskMap).forEach(task => {
      if (task === 'taskListlength') {
        return;
      }
      const { x: taskX2, y: taskY2, taskWidth: targetTaskwidth } = taskMap[task];
      if (targetX <= taskX2 + targetTaskwidth && targetX >= taskX2 && targetY >= taskY2 && targetY < taskY2 + rowHeight) {
        res = task;
      }
    });
    return res;
  };

  const checkErrorLine = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      return true;
    }
    const targetStartValue = Selectors.getCellValue(state, snapshot, targetId, startFieldId);
    const sourceEndValue = Selectors.getCellValue(state, snapshot, sourceId, endFieldId);

    if (targetStartValue && sourceEndValue && targetStartValue <= sourceEndValue) {
      return true;
    }
    const { sourceAdj, nodeIdMap } = linkCycleEdges;
    const sourceAdjCopy = fastCloneDeep(sourceAdj);
    const nodeIdMapCopy = fastCloneDeep(nodeIdMap);

    sourceAdjCopy[sourceId] = sourceAdjCopy[sourceId] ? [...sourceAdjCopy[sourceId], targetId] : [targetId];

    if (!nodeIdMapCopy.includes(sourceId)) nodeIdMapCopy.push(sourceId);
    if (!nodeIdMapCopy.includes(targetId)) nodeIdMapCopy.push(targetId);

    const cycleEdges = getAllCycleDAG(nodeIdMapCopy, sourceAdjCopy);

    const taskLineName = getTaskLineName(sourceId, targetId);
    if (cycleEdges.includes(taskLineName)) {
      return true;
    }

    return false;
  };

  const switchArrowStyle = (color: string, dashEnabled: boolean) => {
    circle1Ref.current.fill(color);
    circle2Ref.current.fill(color);
    arrowRef?.current?.fill(color);
    arrowRef?.current?.stroke(color);
    arrowRef?.current?.dashEnabled(dashEnabled);
  };

  const onDragMove = e => {
    const node = e.target;
    const curX = node.x();
    const curY = node.y();

    const targetRecordId = includeTask(curX, curY);

    const noScrollCb = () => setDrawingLinePoints([x, y + 6, x, curY, curX, curY]);
    const horizontalScrollCb = ({ scrollLeft }) => {
      setDrawingLinePoints([x, y + 6, x, curY, scrollLeft + pointX - gridWidth, curY]);
    };
    const verticalScrollCb = ({ scrollTop }) => setDrawingLinePoints([x, y + 6, x, scrollTop + pointY, curX, scrollTop + pointY]);
    const allScrollCb = ({ scrollLeft, scrollTop }) =>
      setDrawingLinePoints([x, y + 6, x, scrollTop + pointY, scrollLeft + pointX - gridWidth, scrollTop + pointY]);
    onDragScrollSpacing(
      scrollHandler,
      gridWidth,
      instance,
      scrollState,
      pointPosition,
      noScrollCb,
      horizontalScrollCb,
      verticalScrollCb,
      allScrollCb,
    );

    if (targetRecordId !== '' && checkErrorLine(sourceRecordId, targetRecordId)) {
      switchArrowStyle(colors.fc10, true);
      setTargetTaskInfo({ recordId: targetRecordId, dashEnabled: true });
    } else {
      switchArrowStyle(colors.borderBrand, false);
      setTargetTaskInfo({ recordId: targetRecordId, dashEnabled: false });
    }
  };

  const onDragEnd = e => {
    setDrawingLinePoints([]);
    setLinePointStyle(2, colors.blackBlue[400]);
    if (targetTaskInfo && targetTaskInfo.recordId !== '') {
      if (targetTaskInfo.recordId === sourceRecordId) {
        return;
      }

      const fieldRole = Selectors.getFieldRoleByFieldId(fieldPermissionMap, linkFieldId);
      const isDrawPermission = [ConfigConstant.Role.Editor, null].includes(fieldRole);

      if (!isDrawPermission) {
        Message.warning({
          content: t(Strings.gantt_not_rights_to_link_warning),
        });
        return;
      }
      const linkFieldInfo = Selectors.getField(state, linkFieldId);
      const limitSingleRecord = linkFieldInfo.property.limitSingleRecord;
      const cellValue = Selectors.getCellValue(state, snapshot, targetTaskInfo.recordId, linkFieldId) || [];
      if (limitSingleRecord && cellValue.length > 0) {
        Message.warning({
          content: t(Strings.gantt_not_allow_link_multuble_records_gantt_warning),
        });
        return;
      }
      resourceService?.instance?.commandManager?.execute({
        cmd: CollaCommandName.SetRecords,
        data: [
          {
            recordId: targetTaskInfo.recordId,
            fieldId: linkFieldId,
            value: [...cellValue, sourceRecordId],
          },
        ],
      });
    }
  };

  const drawingLine = (
    <Group onMouseMove={() => setLinePointStyle(3.5, colors.borderBrand)} onMouseLeave={() => setLinePointStyle(2, colors.blackBlue[400])}>
      <Arrow
        _ref={arrowRef}
        points={drawingLinePoints}
        fill={colors.borderBrand}
        stroke={colors.borderBrand}
        strokeWidth={1}
        lineCap="round"
        dash={[2, 5]}
        dashEnabled={false}
        pointerLength={5}
        pointerWidth={5}
      />
      <Group x={x} y={y}>
        <Circle _ref={circle1Ref} radius={4} fill={colors.blackBlue[400]} />
        <Circle _ref={circle2Ref} radius={2} fill={colors.blackBlue[400]} stroke={colors.fc8} strokeWidth={2} />
      </Group>
      <Circle
        name={generateTargetName({
          targetName: KONVA_DATASHEET_ID.GANTT_LINE_POINT,
          recordId: sourceRecordId,
        })}
        x={x}
        y={y}
        radius={5}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        draggable
      />
    </Group>
  );

  return {
    drawingLine,
  };
};
