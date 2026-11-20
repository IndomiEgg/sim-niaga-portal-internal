import { Link } from 'react-router-dom';

export function Mark({ children, tone = 'blue' }) { return <span className={`mark mark-${tone}`}>{children}</span>; }

export function Button({ children, kind = 'primary', ...props }) { return <button className={`button button-${kind}`} {...props}>{children}</button>; }

export function Brand({ compact = false }) { return <Link className="brand" to="/"><span className="brand-symbol">N</span>{!compact && <span><strong>SIM<span>Niaga</span></strong><small>ADMINISTRASI NIAGA</small></span>}</Link>; }

export function PageTitle({ eyebrow, title, description, actions }) { return <div className="page-title-row"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{actions && <div className="page-actions">{actions}</div>}</div>; }

export function Status({value}) { const tone=value==='Selesai'||value==='Terverifikasi'?'green':value==='Diproses'?'blue':value.includes('perbaikan')?'red':'amber'; return <Mark tone={tone}><i className="status-dot"/>{value}</Mark>; }
