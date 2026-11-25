import { appTitle } from '../../config/app'

export default function Brand() {
  return (
    <div className="brand">
      <span aria-hidden="true">N</span>
      {appTitle}
    </div>
  )
}
