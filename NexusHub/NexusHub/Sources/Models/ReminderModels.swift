import SwiftUI

struct ReminderItem: Identifiable, Hashable {
    let id: UUID
    var title: String
    var notes: String?
    var dueDate: Date?
    var isCompleted: Bool
    var priority: Priority
    let list: ReminderList
    var hasReminder: Bool

    enum Priority: Int, Comparable, CaseIterable {
        case none   = 0
        case low    = 1
        case medium = 2
        case high   = 3

        static func < (lhs: Priority, rhs: Priority) -> Bool { lhs.rawValue < rhs.rawValue }

        var label: String {
            switch self {
            case .none:   return ""
            case .low:    return "Low"
            case .medium: return "Medium"
            case .high:   return "High"
            }
        }

        var color: Color {
            switch self {
            case .none:   return .clear
            case .low:    return .blue
            case .medium: return .orange
            case .high:   return .red
            }
        }

        var icon: String {
            switch self {
            case .none:   return "flag"
            case .low:    return "flag.fill"
            case .medium: return "flag.fill"
            case .high:   return "flag.fill"
            }
        }
    }

    var isOverdue: Bool {
        guard let due = dueDate else { return false }
        return due < .now && !isCompleted
    }
}

struct ReminderList: Identifiable, Hashable {
    let id: UUID
    let name: String
    let color: Color
    let icon: String
}
