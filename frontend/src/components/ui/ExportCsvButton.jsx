import { Download } from 'lucide-react'
import { exportCsv } from '@/utils/exportCsv'

export function ExportCsvButton({ filename, columns, rows, separator = ';', label = 'Exporter Excel', className = 'btn-secondary inline-flex items-center gap-2' }) {
    const handleExport = () => {
        exportCsv(filename, columns, rows, separator)
    }

    return (
        <button type="button" onClick={handleExport} className={className}>
            <Download size={16} />
            {label}
        </button>
    )
}
