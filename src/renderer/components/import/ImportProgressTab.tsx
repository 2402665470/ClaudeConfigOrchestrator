import React, { useState, useEffect } from 'react';
import { Card, Typography, Progress, List, Tag, Button, Space, Empty } from 'antd';
import { 
  BarChartOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  LoadingOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface ImportTask {
  id: string;
  name: string;
  type: 'marketplace' | 'local' | 'http' | 'zip';
  stage: 'downloading' | 'extracting' | 'parsing' | 'translating' | 'complete' | 'failed';
  percent: number;
  message: string;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

const ImportProgressTab: React.FC = () => {
  const [tasks, setTasks] = useState<ImportTask[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: 0
  });

  // 模拟获取导入任务列表
  useEffect(() => {
    loadImportTasks();
  }, []);

  const loadImportTasks = async () => {
    try {
      // 从主进程获取导入任务历史
      const result = await window.electronAPI.invoke('import:getTasks');
      if (result.success) {
        setTasks(result.tasks || []);
        updateStats(result.tasks || []);
      }
    } catch (error) {
      console.error('加载导入任务失败:', error);
    }
  };

  const updateStats = (taskList: ImportTask[]) => {
    const stats = {
      total: taskList.length,
      completed: taskList.filter(t => t.stage === 'complete').length,
      failed: taskList.filter(t => t.stage === 'failed').length,
      inProgress: taskList.filter(t => 
        ['downloading', 'extracting', 'parsing', 'translating'].includes(t.stage)
      ).length
    };
    setStats(stats);
  };

  const clearCompletedTasks = async () => {
    try {
      const result = await window.electronAPI.invoke('import:clearCompleted');
      if (result.success) {
        await loadImportTasks();
      }
    } catch (error) {
      console.error('清理任务失败:', error);
    }
  };

  const clearAllTasks = async () => {
    try {
      const result = await window.electronAPI.invoke('import:clearAll');
      if (result.success) {
        await loadImportTasks();
      }
    } catch (error) {
      console.error('清理任务失败:', error);
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'downloading':
      case 'extracting':
      case 'parsing':
      case 'translating':
        return <LoadingOutlined className="text-blue-500" />;
      case 'complete':
        return <CheckCircleOutlined className="text-green-500" />;
      case 'failed':
        return <CloseCircleOutlined className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStageText = (stage: string) => {
    switch (stage) {
      case 'downloading':
        return '下载中';
      case 'extracting':
        return '解压中';
      case 'parsing':
        return '解析中';
      case 'translating':
        return '翻译中';
      case 'complete':
        return '完成';
      case 'failed':
        return '失败';
      default:
        return stage;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'marketplace':
        return '市场导入';
      case 'local':
        return '本地目录';
      case 'http':
        return 'HTTP 链接';
      case 'zip':
        return 'ZIP 上传';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'marketplace':
        return 'blue';
      case 'local':
        return 'green';
      case 'http':
        return 'orange';
      case 'zip':
        return 'purple';
      default:
        return 'default';
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = Math.floor((end.getTime() - startTime.getTime()) / 1000);
    
    if (duration < 60) {
      return `${duration}秒`;
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}分${duration % 60}秒`;
    } else {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return `${hours}小时${minutes}分`;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 统计概览 */}
      <Card title="导入统计" className="border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-700 mb-1">{stats.total}</div>
            <Text className="text-sm text-slate-500">总任务数</Text>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{stats.completed}</div>
            <Text className="text-sm text-slate-500">已完成</Text>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">{stats.failed}</div>
            <Text className="text-sm text-slate-500">失败</Text>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{stats.inProgress}</div>
            <Text className="text-sm text-slate-500">进行中</Text>
          </div>
        </div>
      </Card>

      {/* 任务列表 */}
      <Card 
        title="导入任务"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadImportTasks}
              size="small"
            >
              刷新
            </Button>
            <Button 
              icon={<DeleteOutlined />} 
              onClick={clearCompletedTasks}
              size="small"
            >
              清理已完成
            </Button>
            <Button 
              icon={<DeleteOutlined />} 
              onClick={clearAllTasks}
              size="small"
              danger
            >
              清理全部
            </Button>
          </Space>
        }
        className="border-slate-200"
      >
        {tasks.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无导入任务"
          />
        ) : (
          <List
            dataSource={tasks}
            renderItem={(task) => (
              <List.Item className="border-b border-slate-100 last:border-b-0">
                <div className="w-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      {getStageIcon(task.stage)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Title level={5} className="mb-0">
                            {task.name}
                          </Title>
                          <Tag color={getTypeColor(task.type)}>
                            {getTypeText(task.type)}
                          </Tag>
                          <Tag color={task.stage === 'complete' ? 'success' : 
                                     task.stage === 'failed' ? 'error' : 'processing'}>
                            {getStageText(task.stage)}
                          </Tag>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-500 mb-2">
                          <span>开始时间: {task.startTime.toLocaleString()}</span>
                          <span>耗时: {formatDuration(task.startTime, task.endTime)}</span>
                        </div>
                        
                        {task.stage !== 'complete' && task.stage !== 'failed' && (
                          <div className="mb-2">
                            <Progress
                              percent={task.percent}
                              size="small"
                              showInfo={false}
                              status="active"
                            />
                          </div>
                        )}
                        
                        <Text className="text-sm text-slate-600">
                          {task.message}
                        </Text>
                        
                        {task.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                            错误: {task.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 使用说明 */}
      <Card title="说明" className="border-slate-200">
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>此页面显示所有导入任务的实时进度和历史记录</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>导入过程包括：下载→解压→解析→翻译→完成</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>可以随时查看任务状态，失败的任务会显示具体错误信息</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircleOutlined className="text-green-500 mt-0.5" />
            <span>使用"清理已完成"按钮可以清除成功的任务记录</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImportProgressTab;