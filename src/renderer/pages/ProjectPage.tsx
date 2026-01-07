import React, { useEffect, useState } from 'react';
import { 
  Button, 
  Space, 
  Typography, 
  message, 
  Modal, 
  Input,
  Spin,
  Empty,
  Row,
  Col
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ProjectCard } from '../components/projects/ProjectCard';
import { ApplyTemplateModal } from '../components/projects/ApplyTemplateModal';
import { InjectionHistoryModal } from '../components/projects/InjectionHistoryModal';
import { useProjectsStore } from '../stores/projectsStore';
import type { Project, ProjectConfig } from '@common/types';

const { Title } = Typography;
const { confirm } = Modal;

export const ProjectPage: React.FC = () => {
  const {
    projects,
    loading,
    error,
    projectConfigs,
    setProjects,
    addProject,
    hideProject,
    removeProject,
    setLoading,
    setError,
    setProjectConfig,
    getVisibleProjects,
    getProjectConfig,
  } = useProjectsStore();

  const [addProjectModalVisible, setAddProjectModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [applyTemplateModalVisible, setApplyTemplateModalVisible] = useState(false);
  const [selectedProjectForTemplate, setSelectedProjectForTemplate] = useState<Project | null>(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedProjectForHistory, setSelectedProjectForHistory] = useState<Project | null>(null);

  // 加载项目列表
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allProjects = await window.electronAPI.projectService.getVisible();
      setProjects(allProjects);

      // 为每个项目加载配置
      for (const project of allProjects) {
        try {
          const config = await window.electronAPI.projectService.scanConfig(project.path);
          setProjectConfig(project.id, config);
        } catch (error) {
          console.warn(`扫描项目配置失败: ${project.path}`, error);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载项目失败';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 选择项目目录
  const handleSelectDirectory = async () => {
    try {
      const path = await window.electronAPI.projectService.selectDirectory();
      if (path) {
        setSelectedPath(path);
        // 从路径中提取默认名称
        const defaultName = path.split(/[/\\]/).pop() || '';
        setNewProjectName(defaultName);
      }
    } catch (error) {
      message.error('选择目录失败');
    }
  };

  // 添加项目
  const handleAddProject = async () => {
    if (!selectedPath) {
      message.error('请先选择项目目录');
      return;
    }

    try {
      const project = await window.electronAPI.projectService.add(
        selectedPath,
        newProjectName.trim() || undefined
      );
      
      addProject(project);
      
      // 扫描项目配置
      try {
        const config = await window.electronAPI.projectService.scanConfig(project.path);
        setProjectConfig(project.id, config);
      } catch (error) {
        console.warn('扫描项目配置失败', error);
      }

      message.success('项目添加成功');
      setAddProjectModalVisible(false);
      setNewProjectName('');
      setSelectedPath(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '添加项目失败';
      message.error(errorMessage);
    }
  };

  // 打开项目文件夹
  const handleOpenFolder = async (projectPath: string) => {
    try {
      await window.electronAPI.projectService.openFolder(projectPath);
    } catch (error) {
      message.error('打开文件夹失败');
    }
  };

  // 应用模板
  const handleApplyTemplate = (project: Project) => {
    setSelectedProjectForTemplate(project);
    setApplyTemplateModalVisible(true);
  };

  // 执行模板应用
  const handleExecuteTemplateApplication = async (
    templateId: string, 
    conflictResolutions: Record<string, 'overwrite' | 'skip'>
  ) => {
    if (!selectedProjectForTemplate) return;

    try {
      // TODO: 调用注入服务执行模板应用
      // await window.electronAPI.injectionService.applyTemplate(
      //   selectedProjectForTemplate.path,
      //   templateId,
      //   { conflictResolution: conflictResolutions }
      // );
      
      message.success('模板应用成功');
      setApplyTemplateModalVisible(false);
      setSelectedProjectForTemplate(null);
      
      // 重新扫描项目配置
      if (selectedProjectForTemplate) {
        try {
          const config = await window.electronAPI.projectService.scanConfig(selectedProjectForTemplate.path);
          setProjectConfig(selectedProjectForTemplate.id, config);
        } catch (error) {
          console.warn('重新扫描项目配置失败', error);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '应用模板失败';
      message.error(errorMessage);
    }
  };

  // 查看历史
  const handleViewHistory = (project: Project) => {
    setSelectedProjectForHistory(project);
    setHistoryModalVisible(true);
  };

  // 执行回滚
  const handleRollback = async (backupId: string) => {
    if (!selectedProjectForHistory) return;

    try {
      await window.electronAPI.projectService.rollback(
        selectedProjectForHistory.path,
        backupId
      );
      
      message.success('回滚成功');
      
      // 重新扫描项目配置
      try {
        const config = await window.electronAPI.projectService.scanConfig(selectedProjectForHistory.path);
        setProjectConfig(selectedProjectForHistory.id, config);
      } catch (error) {
        console.warn('重新扫描项目配置失败', error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '回滚失败';
      message.error(errorMessage);
      throw error; // 重新抛出错误，让弹窗组件处理
    }
  };

  // 隐藏项目
  const handleHideProject = async (projectId: string) => {
    try {
      await window.electronAPI.projectService.hide(projectId);
      hideProject(projectId);
    } catch (error) {
      message.error('隐藏项目失败');
    }
  };

  // 删除项目
  const handleDeleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    confirm({
      title: '确认删除',
      content: `确定要删除项目 "${project.name}" 吗？这不会删除项目文件，只会从列表中移除。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await window.electronAPI.projectService.delete(projectId);
          removeProject(projectId);
        } catch (error) {
          message.error('删除项目失败');
        }
      },
    });
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const visibleProjects = getVisibleProjects();

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          项目管理
        </Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadProjects}
            loading={loading}
          >
            刷新
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setAddProjectModalVisible(true)}
          >
            添加项目
          </Button>
        </Space>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Typography.Text type="danger">{error}</Typography.Text>
        </div>
      )}

      {!loading && !error && visibleProjects.length === 0 && (
        <Empty
          description="暂无项目"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setAddProjectModalVisible(true)}
          >
            添加第一个项目
          </Button>
        </Empty>
      )}

      {!loading && !error && visibleProjects.length > 0 && (
        <Row gutter={[16, 16]}>
          {visibleProjects.map((project) => (
            <Col key={project.id} xs={24} sm={12} lg={8} xl={6}>
              <ProjectCard
                project={project}
                config={getProjectConfig(project.id)}
                onOpenFolder={handleOpenFolder}
                onApplyTemplate={handleApplyTemplate}
                onViewHistory={handleViewHistory}
                onHide={handleHideProject}
                onDelete={handleDeleteProject}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* 添加项目弹窗 */}
      <Modal
        title="添加项目"
        open={addProjectModalVisible}
        onOk={handleAddProject}
        onCancel={() => {
          setAddProjectModalVisible(false);
          setNewProjectName('');
          setSelectedPath(null);
        }}
        okText="添加"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>项目目录</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Button onClick={handleSelectDirectory} style={{ width: '100%' }}>
                {selectedPath ? selectedPath : '选择项目目录'}
              </Button>
            </div>
          </div>
          
          <div>
            <Typography.Text strong>项目名称</Typography.Text>
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="输入项目名称（可选）"
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>

      {/* 应用模板弹窗 */}
      <ApplyTemplateModal
        visible={applyTemplateModalVisible}
        project={selectedProjectForTemplate}
        onCancel={() => {
          setApplyTemplateModalVisible(false);
          setSelectedProjectForTemplate(null);
        }}
        onApply={handleExecuteTemplateApplication}
      />

      {/* 注入历史弹窗 */}
      <InjectionHistoryModal
        visible={historyModalVisible}
        project={selectedProjectForHistory}
        onCancel={() => {
          setHistoryModalVisible(false);
          setSelectedProjectForHistory(null);
        }}
        onRollback={handleRollback}
      />
    </div>
  );
};