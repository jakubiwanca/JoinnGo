/**
 * @param {Object} event - Wydarzenie
 * @param {boolean} isOrganizer - Czy aktualny użytkownik jest organizatorem?
 * @param {boolean} isJoined - Czy aktualny użytkownik dołączył do wydarzenia?
 * @param {string|number} participationStatus - Status uczestnictwa (jeśli dołączono)
 * @returns {string} Nazwa klasy CSS dla karty wydarzenia
 */
export const getEventColorClass = (event, isOrganizer, isJoined, participationStatus) => {
  let cardColorClass = 'event-public'

  const isPending =
    participationStatus === 0 ||
    participationStatus === 'Interested' ||
    participationStatus === 'Pending'
  const isRejected = participationStatus === 2 || participationStatus === 'Rejected'

  if (isOrganizer) {
    cardColorClass = 'event-created'
  } else if (isJoined) {
    if (isPending) {
      cardColorClass = 'event-pending'
    } else if (isRejected) {
      cardColorClass = 'event-rejected'
    } else {
      cardColorClass = 'event-joined'
    }
  } else if (event?.isPrivate) {
    cardColorClass = 'event-private'
  }

  return cardColorClass
}
