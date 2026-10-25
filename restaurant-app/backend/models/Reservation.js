// Reservation Schema Model Placeholder
export class Reservation {
  constructor(id, userId, tableId, date, time, guestCount, status = 'PENDING') {
    this.id = id;
    this.userId = userId;
    this.tableId = tableId;
    this.date = date;
    this.time = time;
    this.guestCount = guestCount;
    this.status = status;
  }
}
