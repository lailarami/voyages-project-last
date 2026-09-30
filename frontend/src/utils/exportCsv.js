export function exportCsv(filename, columns, rows, separator = ';') {
    const escapeValue = (value) => {
        const normalized = value == null ? '' : String(value)
        return `"${normalized.replace(/"/g, '""')}"`
    }

    const header = columns.map((column) => escapeValue(column.label)).join(separator)
    const body = rows.map((row, rowIndex) => columns.map((column) => {
        const cell = typeof column.value === 'function' ? column.value(row, rowIndex) : row[column.value]
        return escapeValue(cell)
    }).join(separator))

    const bom = '\uFEFF'
    const blob = new Blob([bom + `${header}\r\n${body.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
}
