import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  List, 
  Typography, 
  Space, 
  Tag, 
  Button, 
  Empty,
  Spin,
  message,
  Popconfirm,
  Card,
  Divider
} from 'antd';
import { 
  HistoryOutlined, 
  RollbackOutlined, 
  ClockCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { Project, BackupInfo } from '@common/types';

const { Title, Text, Paragraph } = Typography;

interface InjectionHistoryModalProps {
  visible: boolean;
  project: Project | null;
  onCancel: () => void;
  onRollback: (backupId: string) => void;
}

export const InjectionHistoryModal: React.FC<InjectionHistoryModalProps> = ({
  visible,
  project,
  onCancel,
  onRollback,
}) => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载备份历史
  useEffect(() => {
    if (visible && project) {
      loadBackupHistory();
    }
  }, [visible, project]);

  const loadBackupHistory = async () => {
    if (!project) return;

    try {
      setLoading(true);
      const backupList = await window.electronAPI.projectService.getBackups(project.path);
      setBackups(backupList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error('加载备份历史失败:', error);
      message.error('加载备份历史失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (backupId: string) => {
    try {
      onRollback(backupId);
      message.success('回滚成功');
      onCancel();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '回滚失败';
      message.error(errorMessage);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getCapabilityTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      skill: 'blue',
      command: 'green',
      agent: 'purple',
      hook: 'orange',
      mcp: 'red',
      setting: 'cyan',
    };
    return colors[type] || 'default';
  };

  const getCapabilityTypeName = (type: string) => {
    const names: Record<string, string> = {
      skill: '技能',
      command: '命令',
      agent: '代理',
      hook: '钩子',
      mcp: 'MCP',
      setting: '设置',
    };
    return names[type] || type;
  };

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          <span>注入历史 - {project?.name}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>
      ]}
      width={800}
    >
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        )}

        {!loading && backups.length === 0 && (
          <Empty
            description="暂无注入历史"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Paragraph type="secondary">
              当您首次向此项目应用配置模板时，系统会自动创建备份记录。
            </Paragraph>
          </Empty>
        )}

        {!loading && backups.length > 0 && (
          <List
            dataSource={backups}
            renderItem={(backup, index) => (
              <List.Item key={backup.id}>
                <Card 
                  size="small" 
                  style={{ width: '100%' }}
                  title={
                    <Space>
                      <ClockCircleOutlined />
                      <Text strong>
                        {index === 0 ? '最新备份' : `备份 #${backups.length - index}`}
                      </Text>
                      <Tag color="blue">
                        {formatDate(backup.timestamp)}
                      </Tag>
                    </Space>
                  }
                  extra={
                    index > 0 && (
                      <Popconfirm
                        title="确认回滚"
                        description={`确定要回滚到此备份版本吗？这将覆盖当前的项目配置。`}
                        onConfirm={() => handleRollback(backup.id)}
                        okText="确认回滚"
                        cancelText="取消"
                        okType="danger"
                      >
                        <Button 
                          type="primary" 
                          danger 
                          size="small"
                          icon={<RollbackOutlined />}
                        >
                          回滚到此版本
                        </Button>
                      </Popconfirm>
                    )
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>备份路径: </Text>
                      <Text code style={{ fontSize: '11px' }}>
                        {backup.backupPath}
                      </Text>
                    </div>

                    {backup.capabilities && backup.capabilities.length > 0 && (
                      <div>
                        <Text strong>包含能力 ({backup.capabilities.length}): </Text>
                        <div style={{ marginTop: 8 }}>
                          <Space wrap>
                            {backup.capabilities.map((capabilityName, idx) => {
                              // 从能力名称推断类型（这里是简化处理）
                              const type = capabilityName.includes('.md') ? 'command' : 'skill';
                              return (
                                <Tag 
                                  key={idx} 
                                  color={getCapabilityTypeColor(type)}
                                  style={{ fontSize: '11px' }}
                                >
                                  <FileTextOutlined style={{ marginRight: 4 }} />
                                  {capabilityName}
                                </Tag>
                              );
                            })}
                          </Space>
                        </div>
                      </div>
                    )}

                    {index === 0 && (
                      <div>
                        <Tag color="green">当前版本</Tag>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          这是项目的当前配置状态
                        </Text>
                      </div>
                    )}
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        )}
      </div>
    </Modal>
  );
};