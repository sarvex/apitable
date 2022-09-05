import ReactDOM from 'react-dom';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Modal } from 'antd';
import { IField, Strings, t } from '@vikadata/core';
import { store } from 'pc/store';
import { FormulaModal } from './formula_modal';
import { ComponentDisplay, ScreenSize } from 'pc/components/common/component_display';
import { Popup } from 'pc/components/common/mobile/popup';
import styles from './styles.module.less';

export function openFormulaModal(props: { field: IField; expression: string; onSave?: (exp: string) => void; onClose?: () => void }) {
  const { field, expression, onSave, onClose } = props;

  const container = document.createElement('div');
  document.body.appendChild(container);

  const removeNode = () => {
    ReactDOM.unmountComponentAtNode(container);
    container.parentElement!.removeChild(container);
  };

  const onModalClose = () => {
    removeNode();
    onClose && onClose();
  };

  const onModalSave = (v: string) => {
    removeNode();
    onSave && onSave(v);
  };

  const Content: React.ReactElement = <FormulaModal field={field} expression={expression} onSave={onModalSave} onClose={onModalClose} />;

  ReactDOM.render(
    <Provider store={store}>
      <ComponentDisplay minWidthCompatible={ScreenSize.md}>
        <Modal
          className={styles.formulaModalWrapper}
          visible
          onCancel={onModalClose}
          closable={false}
          mask={false}
          destroyOnClose
          footer={null}
          width={540}
          centered
        >
          {Content}
        </Modal>
      </ComponentDisplay>

      <ComponentDisplay maxWidthCompatible={ScreenSize.md}>
        <Popup visible onClose={onModalClose} height="90%" title={t(Strings.input_formula)}>
          {Content}
        </Popup>
      </ComponentDisplay>
    </Provider>,
    container,
  );
}
