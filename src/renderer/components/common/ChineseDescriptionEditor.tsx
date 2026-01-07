import React, { useState } from 'react';
import { Modal, Input, Button, Space, Typography, message } from 'antd';
import { EditOutlined, DeleteOutlined, TranslationOutlined } from '@ant-design/icons';
import type { Capability } from '@common/types';
import { getDisplayDescription, hasChineseDescription } from '@common/utils';
import { useCapabilitiesStore } from '../../stores/capabilitiesStore';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface ChineseDescriptionEditorProps {
  capability: Capability;
  trigger?: React.ReactNode;
  onUpdate?: (capability: Capability) => void;
}

/**
 * 中文描述编辑组件
 * 支持编辑和清除能力的中文描述
 */
const ChineseDescriptionEditor: React.FC<ChineseDescriptionEditorProps> = ({
  capability,
  trigger,
  onUpdate,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [chineseDescription, setChineseDescription] = useState(
    capability.chineseDescription || ''
  );
  const [loading, setLoading] = useState(false);

  const { updateChineseDescription, clearChineseDescription } = useCapabilitiesStore();

  const showModal = () => {
    setChineseDescription(capability.chineseDescription || '');
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setChineseDescription(capability.chineseDescription || '');
  };

  const handleSave = async () => {
    if (chineseDescription.trim() === '') {
      message.warning('中文描述不能为空');
      return;
    }

    setLoading(true);
    try {
      await updateChineseDescription(capability.id, chineseDescription.trim());
      message.success('中文描述已保存');
      setIsModalVisible(false);
      
      // Notify parent component if callback provided
      if (onUpdate) {
        const updatedCapability = {
          ...capability,
          chineseDescription: chineseDescription.trim(),
          translationStatus: 'manually_edited' as const,
          updatedAt: new Date(),
        };
        onUpdate(updatedCapability);
      }
    } catch (error) {
      message.error('保存失败，请重试');
      console.error('Failed to save Chinese description:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    try {
      await clearChineseDescription(capability.id);
      message.success('中文描述已清除');
      setIsModalVisible(false);
      
      // Notify parent component if callback provided
      if (onUpdate) {
        const updatedCapability = {
          ...capability,
          chineseDescription: undefined,
          translationStatus: 'pending' as const,
          updatedAt: new Date(),
        };
        onUpdate(updatedCapability);
      }
    } catch (error) {
      message.error('清除失败，请重试');
      console.error('Failed to clear Chinese description:', error);
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button
      type="text"
      icon={<EditOutlined />}
      size="small"
      title="编辑中文描述"
    >
      编辑
    </Button>
  );

  return (
    <>
      <span onClick={showModal}>
        {trigger || defaultTrigger}
      </span>

      <Modal
        title={
          <Space>
            <TranslationOutlined />
            <span>编辑中文描述</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        width={600}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button
            key="clear"
            danger
            icon={<DeleteOutlined />}
            onClick={handleClear}
            loading={loading}
            disabled={!hasChineseDescription(capability)}
          >
            清除中文描述
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSave}
            loading={loading}
          >
            保存
          </Button>,
        ]}
      >
        <Space direction="vertical" className="w-full" size="middle">
          <div>
            <Title level={5} className="mb-2">
              能力信息
            </Title>
            <div className="bg-gray-50 p-3 rounded">
              <Text strong>名称：</Text>
              <Text>{capability.name}</Text>
              <br />
              <Text strong>类型：</Text>
              <Text>{capability.type}</Text>
              <br />
              <Text strong>来源：</Text>
              <Text>{capability.sourcePlugin}</Text>
            </div>
          </div>

          <div>
            <Title level={5} className="mb-2">
              原文描述
            </Title>
            <div className="bg-gray-50 p-3 rounded">
              <Text>{capability.originalDescription}</Text>
            </div>
          </div>

          <div>
            <Title level={5} className="mb-2">
              中文描述
            </Title>
            <TextArea
              value={chineseDescription}
              onChange={(e) => setChineseDescription(e.target.value)}
              placeholder="请输入中文描述..."
              rows={4}
              maxLength={500}
              showCount
            />
          </div>

          {hasChineseDescription(capability) && (
            <div>
              <Title level={5} className="mb-2">
                当前显示
              </Title>
              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <Text>{getDisplayDescription(capability)}</Text>
              </div>
            </div>
          )}
        </Space>
      </Modal>
    </>
  );
};

export default ChineseDescriptionEditor;