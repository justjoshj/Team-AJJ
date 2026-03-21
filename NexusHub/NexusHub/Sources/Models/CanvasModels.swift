import SwiftUI

// MARK: - Assignment

struct Assignment: Identifiable, Hashable {
    let id: UUID
    let title: String
    let course: String
    let courseColor: Color
    let dueDate: Date
    let points: Int
    var status: Status
    let description: String

    enum Status: String, CaseIterable {
        case missing    = "Missing"
        case upcoming   = "Upcoming"
        case submitted  = "Submitted"
        case graded     = "Graded"
        case late       = "Late"

        var color: Color {
            switch self {
            case .missing:   return .canvasRed
            case .upcoming:  return Color(white: 1, opacity: 0.7)
            case .submitted: return .calendarGreen
            case .graded:    return .mailBlue
            case .late:      return .reminderOrange
            }
        }

        var icon: String {
            switch self {
            case .missing:   return "exclamationmark.circle.fill"
            case .upcoming:  return "clock.fill"
            case .submitted: return "paperplane.fill"
            case .graded:    return "checkmark.seal.fill"
            case .late:      return "clock.badge.exclamationmark.fill"
            }
        }
    }

    var daysUntilDue: Int {
        Calendar.current.dateComponents([.day], from: .now, to: dueDate).day ?? 0
    }

    var isUrgent: Bool { daysUntilDue <= 1 && status == .upcoming }
    var isOverdue: Bool { dueDate < .now && status == .upcoming }
}

// MARK: - Canvas Event

struct CanvasEvent: Identifiable, Hashable {
    let id: UUID
    let title: String
    let course: String
    let courseColor: Color
    let startDate: Date
    let endDate: Date?
    let location: String?
    let type: EventType

    enum EventType: String {
        case quiz       = "Quiz"
        case exam       = "Exam"
        case meeting    = "Meeting"
        case office     = "Office Hours"
        case other      = "Event"

        var icon: String {
            switch self {
            case .quiz:    return "pencil.circle.fill"
            case .exam:    return "doc.text.fill"
            case .meeting: return "person.2.fill"
            case .office:  return "door.right.hand.open"
            case .other:   return "calendar.badge.clock"
            }
        }
    }
}

// MARK: - Course

struct Course: Identifiable, Hashable {
    let id: UUID
    let name: String
    let code: String
    let color: Color
    let instructor: String
    var assignmentCount: Int
    var pendingCount: Int
}
