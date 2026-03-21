import SwiftUI

struct CalendarEvent: Identifiable, Hashable {
    let id: UUID
    let title: String
    let startDate: Date
    let endDate: Date?
    let isAllDay: Bool
    let color: Color
    let calendar: String
    let location: String?
    let notes: String?
    let recurrence: Recurrence?

    enum Recurrence: String {
        case daily   = "Daily"
        case weekly  = "Weekly"
        case monthly = "Monthly"

        var icon: String {
            switch self {
            case .daily:   return "arrow.clockwise"
            case .weekly:  return "repeat"
            case .monthly: return "calendar.badge.clock"
            }
        }
    }

    var isNow: Bool {
        guard !isAllDay, let end = endDate else { return false }
        return startDate <= .now && .now <= end
    }

    var isUpcoming: Bool {
        let cutoff = Date.now.addingTimeInterval(30 * 60)
        return startDate > .now && startDate <= cutoff
    }
}
