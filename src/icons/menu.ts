import {
  ApartmentOutlined, AppstoreOutlined, AuditOutlined, BellOutlined, BookOutlined, CalendarOutlined,
  DownloadOutlined, EditOutlined, FileOutlined, FileTextOutlined, FolderOpenOutlined, HomeOutlined,
  LockOutlined, MenuOutlined, PieChartOutlined, SearchOutlined, SettingOutlined, UserOutlined
} from '@ant-design/icons'
import { localIcons } from './local'

export const menuIcons = {
  house: HomeOutlined,
  user: UserOutlined,
  'office-building': ApartmentOutlined,
  setting: SettingOutlined,
  lock: LockOutlined,
  grid: AppstoreOutlined,
  edit: EditOutlined,
  collection: BookOutlined,
  document: FileTextOutlined,
  files: FileOutlined,
  'folder-opened': FolderOpenOutlined,
  download: DownloadOutlined,
  menu: MenuOutlined,
  notebook: BookOutlined,
  tickets: AuditOutlined,
  bell: BellOutlined,
  calendar: CalendarOutlined,
  'data-analysis': PieChartOutlined,
  'pie-chart': PieChartOutlined,
  search: SearchOutlined,
  ...localIcons
}

export function getMenuIcon(name?: string) {
  return name && Object.hasOwn(menuIcons, name) ? menuIcons[name as keyof typeof menuIcons] : undefined
}
