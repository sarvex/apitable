import { FC } from 'react';
import * as React from 'react';
import styles from './style.module.less';
import { Tooltip, Avatar, IAvatarProps } from 'pc/components/common';
import classNames from 'classnames';
import { OmittedMiddleText } from './omitted_middle_text';
import { UserCardTrigger } from 'pc/components/common/user_card/user_card_trigger';
import { TriggerProps } from 'rc-trigger';
import { MemberType } from '@vikadata/core';

interface ITriggerBase {
  action: TriggerProps['action'];
  popupAlign: TriggerProps['popupAlign'];
}

interface IInfoCardProps {
  title: string | JSX.Element;
  token?: React.ReactNode; // 用户标志（比如管理员）
  description?: string;
  onClick?: () => void; // 卡片是否有点击事件
  originTitle?: string; // 用于搜索状态下展示
  inSearch?: boolean; // 搜索状态下，会使用dangerouslySetInnerHTML，文字内容移出不会气泡显示
  className?: string;
  style?: React.CSSProperties;
  avatarProps: IAvatarProps;
  // 一些其他信息，展示在描述下面
  extra?: string;
  triggerBase?: ITriggerBase;
  userId?: string;
  memberId?: string;
  isDeleted?: boolean;
  memberType?: number;
  isActive?: boolean;
  desc?: string;
}
// const searchTag = '<span class="highLight">';

export const InfoCard: FC<IInfoCardProps> = props => {
  const { 
    title, originTitle = '', description, onClick, extra, triggerBase,
    inSearch = false, className, avatarProps, token, userId, memberId,
    isDeleted = false, memberType = 3, isActive = true, desc, ...rest 
  } = props;

  const isMember = memberType === MemberType.Member;
  const isSelf = userId === 'Self';
  return (
   
    <div
      className={classNames(styles.infoCard, className)}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      {...rest}
    >
      
      <div className={classNames(styles.defaultContent, { [styles.isLeave] : (isDeleted || !isActive) && isMember })}>
        { (triggerBase && !isSelf && isMember )? <UserCardTrigger
          {...triggerBase}
          userId={userId}
          memberId={memberId}
          permissionVisible={false}
          isDeleted={isDeleted}
          isActive={isActive}
          avatarProps={avatarProps}
          spareName={avatarProps.title}
        >
          <div style={{ cursor:  'pointer' }}>
            <Avatar
              
              {...avatarProps}
            />
          </div>
        </UserCardTrigger> :
          <Avatar
            isDefaultIcon={isSelf}
            {...avatarProps}
          />
        }
        <div className={styles.text}>
          {
            inSearch && typeof title === 'string' ?
              <div className={styles.title} dangerouslySetInnerHTML={{ __html: originTitle }} /> :
              <div className={styles.name}>
                <Tooltip title={title} textEllipsis>
                  <div className={classNames(styles.title, 'title')}>
                    {title}
                    {desc && <span className={styles.unitDesc}>{`（${desc}）`}</span>}
                  </div>
                </Tooltip>
                <div className={styles.token}>
                  {token}
                </div>
              </div>
          }
          {description &&
           <OmittedMiddleText suffixCount={5}>{description}</OmittedMiddleText>
          }
          {
            extra && <div className={styles.description}>{extra || ''}</div>
          }
        </div>
      </div>
      {props.children}
      
    </div>
  );
};
