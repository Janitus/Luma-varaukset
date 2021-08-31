import XLSX from 'xlsx'

export const getCSV = (visits) => {
  try {
    const filteredVisits = visits
      .filter(visit => visit.dataUseAgreement)
      .map(visit => {
        return {
          ...visit,
          event: visit.event.title,
          eventId: visit.event.id
        }
      })
    const sheet = XLSX.utils.json_to_sheet(filteredVisits)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'visits')
    XLSX.writeFile(book, 'visits.csv')
  } catch (err) { console.error(err) }
}