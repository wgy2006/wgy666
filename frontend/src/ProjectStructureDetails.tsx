import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Braces,
  CheckCircle2,
  CircleDot,
  FileCode2,
  FileJson,
  FileText,
  Folder,
  GitBranch,
  Layers3,
  Network,
  Package,
  Play,
  Settings2,
  TestTube2,
  Workflow,
} from 'lucide-react'
import type { ClassifiedFile, RepositorySnapshot } from './api'
import './ProjectStructureDetails.css'

export type AnalysisSection = 'architecture' | 'directories' | 'dependencies' | 'entrypoints' | 'quality'

export type ProjectStructureAnalysis = {
  projectType: string
  analyzedFileCount: number
  analysisWarning: string | null
  sourceCount: number
  dependencyFiles: ClassifiedFile[]
  testFiles: ClassifiedFile[]
  docFiles: ClassifiedFile[]
  configFiles: ClassifiedFile[]
  entryFiles: ClassifiedFile[]
  ciFiles: ClassifiedFile[]
  topDirectories: Array<{
    name: string
    count: number
    mainCategory: string
  }>
}

type Props = {
  activeSection: AnalysisSection
  analysis: ProjectStructureAnalysis
  repository: RepositorySnapshot
  onBack: () => void
  onSelect: (section: AnalysisSection) => void
}

const sections: Array<{ id: AnalysisSection; label: string; icon: typeof Network }> = [
  { id: 'architecture', label: '架构图', icon: Network },
  { id: 'directories', label: '主要目录', icon: Boxes },
  { id: 'dependencies', label: '依赖文件', icon: Package },
  { id: 'entrypoints', label: '入口文件', icon: Play },
  { id: 'quality', label: '测试与文档', icon: TestTube2 },
]

const sectionCopy: Record<AnalysisSection, { title: string; description: string }> = {
  architecture: {
    title: '项目架构思维导图',
    description: '把目录、模块和工程支撑能力组织成可浏览的结构视图。',
  },
  directories: {
    title: '主要目录与职责',
    description: '按照目录层级和文件类别展示仓库组成，并给出职责推断。',
  },
  dependencies: {
    title: '依赖清单与关系',
    description: '集中查看依赖声明文件、技术生态和后续可解析的依赖关系。',
  },
  entrypoints: {
    title: '入口文件与启动链路',
    description: '定位可能的程序入口，并展示从启动命令到业务模块的调用过程。',
  },
  quality: {
    title: '测试、文档与工程化',
    description: '汇总测试、文档、配置和 CI/CD 文件，形成项目质量视图。',
  },
}

export function ProjectStructureDetails({ activeSection, analysis, repository, onBack, onSelect }: Props) {
  const copy = sectionCopy[activeSection]

  return (
    <section className="structure-page">
      <header className="structure-page-header">
        <button className="structure-back" type="button" onClick={onBack}>
          <ArrowLeft size={17} aria-hidden="true" />
          返回项目概览
        </button>
        <div className="structure-title-row">
          <div>
            <p className="structure-breadcrumb">{repository.identity.full_name} / 项目解析</p>
            <h2>{copy.title}</h2>
            <p>{copy.description}</p>
          </div>
          <span className="prototype-status">
            <CircleDot size={14} aria-hidden="true" />
            原型示例
          </span>
        </div>
        <nav className="structure-tabs" aria-label="项目结构详情">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                className={activeSection === section.id ? 'active' : ''}
                key={section.id}
                type="button"
                onClick={() => onSelect(section.id)}
              >
                <Icon size={16} aria-hidden="true" />
                {section.label}
              </button>
            )
          })}
        </nav>
      </header>

      <div className="prototype-note">
        当前页面优先使用本次同步结果；缺少的数据以示例状态补全。后续接入知识图谱后，可替换为真实模块关系和调用链。
      </div>

      {activeSection === 'architecture' && <ArchitectureView analysis={analysis} repository={repository} onSelect={onSelect} />}
      {activeSection === 'directories' && <DirectoryView analysis={analysis} />}
      {activeSection === 'dependencies' && <DependencyView analysis={analysis} />}
      {activeSection === 'entrypoints' && <EntryPointView analysis={analysis} />}
      {activeSection === 'quality' && <QualityView analysis={analysis} />}
    </section>
  )
}

function ArchitectureView({ analysis, repository, onSelect }: { analysis: ProjectStructureAnalysis; repository: RepositorySnapshot; onSelect: (section: AnalysisSection) => void }) {
  const directories = displayDirectories(analysis)
  const sourceDirectories = directories.filter((item) => item.mainCategory === 'source_code').slice(0, 3)
  const supportingDirectories = directories.filter((item) => item.mainCategory !== 'source_code').slice(0, 4)

  return (
    <div className="structure-stack">
      <section className="structure-panel architecture-panel">
        <div className="structure-panel-heading">
          <div>
            <p>Repository map</p>
            <h3>{repository.identity.name} 结构视图</h3>
          </div>
          <span>{analysis.analyzedFileCount} 个文件样本</span>
        </div>

        <div className="architecture-map">
          <div className="architecture-root">
            <GitBranch size={20} aria-hidden="true" />
            <strong>{repository.identity.name}</strong>
            <span>{analysis.projectType}</span>
          </div>
          <div className="architecture-branches">
            <ArchitectureBranch
              icon={<Layers3 size={19} />}
              title="核心源码"
              subtitle={`${analysis.sourceCount} 个源码文件`}
              items={sourceDirectories.length > 0 ? sourceDirectories.map((item) => item.name) : ['应用模块', '路由与服务', '公共组件']}
              onClick={() => onSelect('directories')}
            />
            <ArchitectureBranch
              icon={<Package size={19} />}
              title="依赖与运行"
              subtitle={`${analysis.dependencyFiles.length} 份依赖声明`}
              items={displayDependencies(analysis).slice(0, 3).map((file) => file.path)}
              onClick={() => onSelect('dependencies')}
            />
            <ArchitectureBranch
              icon={<Settings2 size={19} />}
              title="工程支撑"
              subtitle={`${analysis.testFiles.length + analysis.docFiles.length + analysis.ciFiles.length} 个相关文件`}
              items={supportingDirectories.length > 0 ? supportingDirectories.map((item) => item.name) : ['tests', 'docs', '.github']}
              onClick={() => onSelect('quality')}
            />
          </div>
        </div>
      </section>

      <section className="structure-panel">
        <div className="structure-panel-heading">
          <div>
            <p>Analysis pipeline</p>
            <h3>自动化解析流程</h3>
          </div>
        </div>
        <div className="pipeline-grid">
          <PipelineStep number="01" title="同步目录树" text="读取 GitHub tree、README 与语言统计" />
          <PipelineStep number="02" title="规则分类" text="识别源码、依赖、测试、文档和配置" />
          <PipelineStep number="03" title="结构建模" text="聚合目录职责、入口候选和模块关系" />
          <PipelineStep number="04" title="可视化展示" text="生成架构图、目录树和工程质量视图" last />
        </div>
      </section>
    </div>
  )
}

function ArchitectureBranch({ icon, title, subtitle, items, onClick }: { icon: React.ReactNode; title: string; subtitle: string; items: string[]; onClick: () => void }) {
  return (
    <button className="architecture-branch" type="button" onClick={onClick}>
      <span className="branch-icon">{icon}</span>
      <span className="branch-copy">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      <span className="branch-items">
        {items.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
      </span>
      <ArrowRight size={17} aria-hidden="true" />
    </button>
  )
}

function PipelineStep({ number, title, text, last = false }: { number: string; title: string; text: string; last?: boolean }) {
  return (
    <article className="pipeline-step">
      <span>{number}</span>
      <strong>{title}</strong>
      <p>{text}</p>
      {!last && <ArrowRight className="pipeline-arrow" size={18} aria-hidden="true" />}
    </article>
  )
}

function DirectoryView({ analysis }: { analysis: ProjectStructureAnalysis }) {
  const directories = displayDirectories(analysis)
  const maxCount = Math.max(...directories.map((item) => item.count), 1)

  return (
    <div className="structure-split">
      <section className="structure-panel directory-tree-panel">
        <div className="structure-panel-heading">
          <div><p>Directory tree</p><h3>仓库目录树</h3></div>
          <span>{directories.length} 个主要目录</span>
        </div>
        <div className="directory-root-row">
          <Folder size={18} aria-hidden="true" />
          <strong>repository/</strong>
        </div>
        <div className="directory-tree">
          {directories.map((directory) => (
            <div className="directory-row" key={directory.name}>
              <span className="tree-line" />
              <Folder size={17} aria-hidden="true" />
              <div>
                <strong>{directory.name}/</strong>
                <small>{categoryLabel(directory.mainCategory)}</small>
              </div>
              <span>{directory.count} files</span>
            </div>
          ))}
        </div>
      </section>

      <section className="structure-panel">
        <div className="structure-panel-heading">
          <div><p>Responsibility inference</p><h3>目录职责推断</h3></div>
        </div>
        <div className="responsibility-list">
          {directories.map((directory) => (
            <article key={directory.name}>
              <div>
                <strong>{directory.name}</strong>
                <span>{directoryDescription(directory.name, directory.mainCategory)}</span>
              </div>
              <div className="responsibility-bar"><span style={{ width: `${Math.max((directory.count / maxCount) * 100, 8)}%` }} /></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function DependencyView({ analysis }: { analysis: ProjectStructureAnalysis }) {
  const dependencies = displayDependencies(analysis)

  return (
    <div className="structure-stack">
      <section className="structure-panel">
        <div className="structure-panel-heading">
          <div><p>Dependency manifests</p><h3>依赖声明文件</h3></div>
          <span>{dependencies.length} 个已展示文件</span>
        </div>
        <div className="dependency-table">
          <div className="dependency-table-head"><span>文件</span><span>生态</span><span>用途</span><span>状态</span></div>
          {dependencies.map((file) => {
            const ecosystem = dependencyEcosystem(file.path)
            return (
              <div className="dependency-table-row" key={file.path}>
                <span><FileJson size={17} aria-hidden="true" /><strong>{file.path}</strong></span>
                <span>{ecosystem}</span>
                <span>{dependencyPurpose(file.path)}</span>
                <span className="dependency-status"><CheckCircle2 size={15} /> 待解析</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="structure-panel dependency-map-panel">
        <div className="structure-panel-heading">
          <div><p>Planned relationship view</p><h3>依赖关系示例</h3></div>
        </div>
        <div className="dependency-map">
          <div className="dependency-source"><FileJson size={19} /><strong>依赖清单</strong><span>pyproject.toml / package.json</span></div>
          <div className="dependency-groups">
            <DependencyGroup title="运行框架" items={['FastAPI', 'React', 'Uvicorn']} />
            <DependencyGroup title="数据与接口" items={['HTTPX', 'Pydantic', 'PostgreSQL']} />
            <DependencyGroup title="开发工具" items={['uv', 'Vite', 'TypeScript']} />
          </div>
        </div>
      </section>
    </div>
  )
}

function DependencyGroup({ title, items }: { title: string; items: string[] }) {
  return <article><strong>{title}</strong>{items.map((item) => <span key={item}>{item}</span>)}</article>
}

function EntryPointView({ analysis }: { analysis: ProjectStructureAnalysis }) {
  const entrypoints = displayEntrypoints(analysis)

  return (
    <div className="structure-stack">
      <section className="structure-panel">
        <div className="structure-panel-heading">
          <div><p>Startup flow</p><h3>启动与调用链路示例</h3></div>
        </div>
        <div className="startup-flow">
          <FlowNode icon={<Play size={18} />} eyebrow="启动命令" title="uv run / npm run dev" />
          <FlowNode icon={<FileCode2 size={18} />} eyebrow="入口文件" title={entrypoints[0]?.path ?? 'app/main.py'} />
          <FlowNode icon={<Workflow size={18} />} eyebrow="注册层" title="路由、组件与中间件" />
          <FlowNode icon={<Braces size={18} />} eyebrow="业务层" title="Service / API Client" />
        </div>
      </section>

      <section className="structure-panel">
        <div className="structure-panel-heading">
          <div><p>Entry candidates</p><h3>入口文件候选</h3></div>
          <span>{entrypoints.length} 个候选</span>
        </div>
        <div className="entrypoint-grid">
          {entrypoints.map((file, index) => (
            <article key={file.path}>
              <span className="entry-rank">0{index + 1}</span>
              <FileCode2 size={20} aria-hidden="true" />
              <div><strong>{file.path}</strong><p>{entryReason(file.path)}</p></div>
              <span className="confidence-chip">{Math.max(92 - index * 9, 65)}% 置信度</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function FlowNode({ icon, eyebrow, title }: { icon: React.ReactNode; eyebrow: string; title: string }) {
  return <article><span className="flow-icon">{icon}</span><small>{eyebrow}</small><strong>{title}</strong><ArrowRight size={18} aria-hidden="true" /></article>
}

function QualityView({ analysis }: { analysis: ProjectStructureAnalysis }) {
  const samples = [
    ...analysis.testFiles.slice(0, 3),
    ...analysis.docFiles.slice(0, 3),
    ...analysis.ciFiles.slice(0, 3),
    ...analysis.configFiles.slice(0, 3),
  ]

  return (
    <div className="structure-stack">
      <section className="quality-metrics">
        <QualityMetric icon={<TestTube2 size={20} />} label="测试文件" value={analysis.testFiles.length} note="单元测试与集成测试" />
        <QualityMetric icon={<FileText size={20} />} label="文档文件" value={analysis.docFiles.length} note="README 与项目文档" />
        <QualityMetric icon={<Settings2 size={20} />} label="配置文件" value={analysis.configFiles.length} note="运行和构建配置" />
        <QualityMetric icon={<GitBranch size={20} />} label="CI/CD" value={analysis.ciFiles.length} note="自动检查与发布" />
      </section>

      <div className="structure-split">
        <section className="structure-panel">
          <div className="structure-panel-heading"><div><p>Engineering files</p><h3>工程文件样本</h3></div></div>
          <div className="engineering-files">
            {(samples.length > 0 ? samples : qualityFallbackFiles()).map((file) => (
              <div key={file.path}><FileText size={16} /><strong>{file.path}</strong><span>{categoryLabel(file.category)}</span></div>
            ))}
          </div>
        </section>
        <section className="structure-panel">
          <div className="structure-panel-heading"><div><p>Quality loop</p><h3>质量保障链路</h3></div></div>
          <div className="quality-loop">
            <span>代码提交</span><ArrowRight size={16} /><span>CI 检查</span><ArrowRight size={16} /><span>自动测试</span><ArrowRight size={16} /><span>文档构建</span>
          </div>
          <div className="quality-todos">
            <p><CheckCircle2 size={16} /> 已完成文件分类和数量统计</p>
            <p><CircleDot size={16} /> 后续解析测试命令、覆盖率和工作流依赖</p>
            <p><CircleDot size={16} /> 后续关联失败测试与具体源码模块</p>
          </div>
        </section>
      </div>
    </div>
  )
}

function QualityMetric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: number; note: string }) {
  return <article><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>
}

function displayDirectories(analysis: ProjectStructureAnalysis) {
  if (analysis.topDirectories.length > 0) return analysis.topDirectories
  return [
    { name: 'backend', count: 42, mainCategory: 'source_code' },
    { name: 'frontend', count: 31, mainCategory: 'source_code' },
    { name: 'tests', count: 18, mainCategory: 'tests' },
    { name: 'docs', count: 12, mainCategory: 'documentation' },
    { name: '.github', count: 6, mainCategory: 'ci_cd' },
  ]
}

function displayDependencies(analysis: ProjectStructureAnalysis): ClassifiedFile[] {
  if (analysis.dependencyFiles.length > 0) return analysis.dependencyFiles.slice(0, 10)
  const files = analysis.projectType.includes('Python')
    ? ['pyproject.toml', 'uv.lock', 'requirements.txt']
    : ['package.json', 'package-lock.json']
  if (analysis.projectType.includes('全栈')) files.push('frontend/package.json')
  return files.map((path) => ({ path, category: 'dependency', size: null }))
}

function displayEntrypoints(analysis: ProjectStructureAnalysis): ClassifiedFile[] {
  if (analysis.entryFiles.length > 0) return analysis.entryFiles.slice(0, 6)
  const paths = analysis.projectType.includes('Python')
    ? ['backend/app/main.py', 'backend/app/api/router.py', 'frontend/src/main.tsx']
    : ['src/main.tsx', 'src/App.tsx', 'vite.config.ts']
  return paths.map((path) => ({ path, category: 'source_code', size: null }))
}

function qualityFallbackFiles(): ClassifiedFile[] {
  return [
    { path: 'tests/test_repository_sync.py', category: 'tests', size: null },
    { path: 'README.md', category: 'documentation', size: null },
    { path: '.github/workflows/test.yml', category: 'ci_cd', size: null },
    { path: 'pyproject.toml', category: 'configuration', size: null },
  ]
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    source_code: '源码模块', tests: '测试', documentation: '文档', configuration: '配置',
    ci_cd: 'CI/CD', dependency: '依赖配置', build: '构建', assets: '静态资源', data: '数据', other: '其他',
  }
  return labels[category] ?? category
}

function directoryDescription(name: string, category: string) {
  const normalized = name.toLowerCase()
  if (normalized.includes('front')) return '前端页面、交互组件与样式资源'
  if (normalized.includes('back') || normalized === 'app' || normalized === 'src') return '核心业务代码与应用模块'
  if (normalized.includes('test')) return '自动化测试与测试数据'
  if (normalized.includes('doc')) return '项目说明、设计和使用文档'
  if (normalized === '.github') return '工作流、Issue 模板与仓库配置'
  if (normalized === '(root)') return '项目级配置和启动文件'
  return `${categoryLabel(category)}相关文件`
}

function dependencyEcosystem(path: string) {
  const name = path.toLowerCase()
  if (name.includes('package')) return 'Node.js'
  if (name.includes('pyproject') || name.includes('requirements') || name.includes('uv.lock')) return 'Python'
  if (name.includes('cargo')) return 'Rust'
  if (name.includes('go.mod')) return 'Go'
  return '通用'
}

function dependencyPurpose(path: string) {
  const name = path.toLowerCase()
  if (name.includes('lock')) return '锁定可复现版本'
  if (name.includes('pyproject') || name.includes('package.json')) return '声明项目与依赖'
  if (name.includes('requirements')) return 'Python 依赖清单'
  return '构建或运行依赖'
}

function entryReason(path: string) {
  const name = path.toLowerCase()
  if (name.endsWith('main.py')) return '包含后端应用创建与服务启动入口'
  if (name.endsWith('main.tsx') || name.endsWith('index.tsx')) return '负责挂载前端根组件'
  if (name.includes('router')) return '集中注册 API 路由和模块入口'
  if (name.endsWith('app.tsx')) return '前端页面结构和交互入口'
  return '文件名和目录位置符合入口规则'
}
