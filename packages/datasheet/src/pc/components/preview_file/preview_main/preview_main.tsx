import { Api, IAttachmentValue, isImage, IUserInfo } from '@vikadata/core';
import NextFilled from 'static/icon/common/next_filled.svg';
import PreviousFilled from 'static/icon/common/previous_filled.svg';
import { ComponentDisplay, ScreenSize } from 'pc/components/common/component_display';
import { useResponsive } from 'pc/hooks';
import { DOC_MIME_TYPE, getDownloadSrc, isSupportImage, KeyCode } from 'pc/utils';
import { useCallback, useEffect, useState } from 'react';
import * as React from 'react';
import { Header } from '../mobile/header';
import { PreviewDisplayList } from '../preview_display_list';
import { ToolBar } from '../tool_bar';
import styles from './style.module.less';
import IconRotate from 'static/icon/datasheet/datasheet_icon_rotate.svg';
import { Swiper } from './swiper';
import { ITransFormInfo } from '../preview_file.interface';
import { Message } from 'pc/components/common';
import mime from 'mime-types';
import useFrameSetState from '../preview_type/preview_image/hooks/use_frame_state';
import { stopPropagation, useThemeColors } from '@vikadata/components';
import { useKeyPress } from 'ahooks';
import { useSelector } from 'react-redux';
import { isFocusingInput } from './util';

interface IPreviewMain {
  activeIndex: number;
  files: IAttachmentValue[];
  setActiveIndex(index: number): void;
  onClose(): void;
  onDelete(): void;
  readonly: boolean;
  userInfo: IUserInfo | null;
  spaceId: string;
  officePreviewEnable: boolean;
  disabledDownload: boolean;
  isFullScreen: boolean;
  toggleIsFullScreen: () => void;
}

export const initTranslatePosition = { x: 0, y: 0 };

export const MAX_SCALE = 5;
export const MIN_SCALE = 0.1;

export const initTransformInfo = {
  scale: 1,
  rotate: 0,
  translatePosition: initTranslatePosition,
  initActualScale: -1,
};

export const PreviewMain: React.FC<IPreviewMain> = props => {
  const {
    activeIndex,
    setActiveIndex,
    files,
    onClose,
    onDelete,
    readonly,
    userInfo,
    spaceId,
    officePreviewEnable,
    disabledDownload,
    isFullScreen,
    toggleIsFullScreen,
  } = props;
  const colors = useThemeColors();
  const { screenIsAtMost, clientWidth: _clientWidth } = useResponsive();
  const rightPaneWidth = useSelector(state => state.rightPane.width);
  const isMobile = screenIsAtMost(ScreenSize.md);
  const clientWidth = typeof rightPaneWidth == 'number' && !isFullScreen ? _clientWidth - rightPaneWidth : _clientWidth;

  // 当前正在预览的 fileInfo 实例
  const activeFile: IAttachmentValue = files[activeIndex];

  const [officePreviewUrl, setOfficePreviewUrl] = useState<string | null>(null);

  const [transformInfo, setTransformInfo] = useFrameSetState<ITransFormInfo>(initTransformInfo);

  const isDocType = DOC_MIME_TYPE.includes(mime.lookup(activeFile.name));
  const isPdf = mime.lookup(activeFile.name) === 'application/pdf';

  const fetchPreviewUrl = async () => {
    if (activeFile && (isDocType || isPdf) && officePreviewEnable) {
      const res = await Api.getAttachPreviewUrl(spaceId!, activeFile.token, activeFile.name);
      const { data, message, success } = res.data;
      if (success) {
        setOfficePreviewUrl(data);
        return;
      }
      Message.error({ content: message });
    }
  };

  useEffect(() => {
    setOfficePreviewUrl(null);
    fetchPreviewUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const handlePrev = useCallback(
    e => {
      e.stopPropagation();

      if (activeIndex - 1 >= 0) {
        setTransformInfo(initTransformInfo, true);
        setActiveIndex(activeIndex - 1);
      }
    },
    [activeIndex, setActiveIndex, setTransformInfo],
  );

  const handleNext = useCallback(
    e => {
      e.stopPropagation();

      if (activeIndex + 1 < files.length) {
        setTransformInfo(initTransformInfo, true);
        setActiveIndex(activeIndex + 1);
      }
    },
    [activeIndex, files.length, setActiveIndex, setTransformInfo],
  );

  useKeyPress([KeyCode.Left], e => {
    if (isFocusingInput()) return;
    handlePrev(e);
  });
  useKeyPress([KeyCode.Right], e => {
    if (isFocusingInput()) return;
    handleNext(e);
  });

  const onZoom = useCallback(
    (newScale: number) => {
      const { initActualScale } = transformInfo;

      const minTransformScale = MIN_SCALE / initActualScale;
      const maxTransformScale = MAX_SCALE / initActualScale;

      setTransformInfo(state => {
        if (newScale <= minTransformScale) {
          return {
            ...state,
            scale: minTransformScale,
            translatePosition: initTranslatePosition,
          };
        }

        if (newScale >= maxTransformScale) {
          return {
            ...state,
            scale: maxTransformScale,
            translatePosition: initTranslatePosition,
          };
        }
        return {
          ...state,
          scale: newScale,
          translatePosition: initTranslatePosition,
        };
      });
    },
    [setTransformInfo, transformInfo],
  );

  const onRotate = useCallback(() => {
    setTransformInfo(state => {
      const rotate = state.rotate || 0;
      return {
        ...state,
        rotate: rotate + 90,
        translatePosition: initTranslatePosition,
      };
    });
  }, [setTransformInfo]);

  if (!activeFile) {
    return null;
  }

  const showPrevBtn = activeIndex !== 0 && !isMobile;
  const showNextBtn = activeIndex !== files.length - 1 && !isMobile;

  return (
    <div className={styles.mainContainer}>
      <ComponentDisplay minWidthCompatible={ScreenSize.md}>
        <header className={styles.header}>
          <ToolBar
            transformInfo={transformInfo}
            setTransformInfo={setTransformInfo}
            fileInfo={activeFile}
            onClose={onClose}
            onDelete={onDelete}
            readonly={readonly}
            onRotate={onRotate}
            previewEnable={officePreviewEnable}
            isDocType={isDocType}
            officePreviewUrl={officePreviewUrl}
            onZoom={onZoom}
            disabledDownload={disabledDownload}
            isFullScreen={isFullScreen}
            toggleIsFullScreen={toggleIsFullScreen}
          />
        </header>
      </ComponentDisplay>

      <ComponentDisplay maxWidthCompatible={ScreenSize.md}>
        <Header
          onClose={onClose}
          downloadSrc={getDownloadSrc(activeFile)}
          readonly={readonly}
          fileName={activeFile.name}
          onDelete={onDelete}
          disabledDownload={disabledDownload}
        />
        {isImage({ name: activeFile.name, type: activeFile.mimeType }) && isSupportImage(activeFile.mimeType) && (
          <div onClick={onRotate} className={styles.rotate}>
            <IconRotate fill={colors.defaultBg} width={16} height={16} />
          </div>
        )}
      </ComponentDisplay>

      <main className={styles.container} onMouseDown={onClose}>
        <div className={styles.left}>
          {// 左侧箭头
          showPrevBtn && (
            <div className={styles.iconPre} onClick={handlePrev} onMouseDown={stopPropagation}>
              <PreviousFilled width={40} height={40} className={styles.prev} />
            </div>
          )}
        </div>
        <div className={styles.middle}>
          <Swiper
            transformInfo={transformInfo}
            clientWidth={clientWidth}
            next={handleNext}
            prev={handlePrev}
            files={files}
            activeIndex={activeIndex}
            userInfo={userInfo}
            spaceId={spaceId}
            onClose={onClose}
            officePreviewEnable={officePreviewEnable}
            previewUrl={officePreviewUrl}
            setTransformInfo={setTransformInfo}
            readonly={readonly}
            disabledDownload={disabledDownload}
          />
        </div>

        <div className={styles.right}>
          {// 右侧箭头
          showNextBtn && (
            <div className={styles.iconNext} onClick={handleNext} onMouseDown={stopPropagation}>
              <NextFilled width={40} height={40} className={styles.next} />
            </div>
          )}
        </div>
      </main>

      <PreviewDisplayList
        activeIndex={activeIndex}
        setActiveIndex={newActiveIndex => {
          if (newActiveIndex !== activeIndex) {
            setTransformInfo(initTransformInfo, true);
            setActiveIndex(newActiveIndex);
          }
        }}
        files={files}
      />
    </div>
  );
};
