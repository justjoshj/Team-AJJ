import SwiftUI

struct MailMessage: Identifiable, Hashable {
    let id: UUID
    let sender: String
    let senderInitials: String
    let senderColor: Color
    let subject: String
    let preview: String
    let body: String
    let date: Date
    var isRead: Bool
    var isStarred: Bool
    let hasAttachment: Bool
    let category: Category

    enum Category: String, CaseIterable {
        case primary    = "Primary"
        case school     = "School"
        case social     = "Social"
        case updates    = "Updates"

        var icon: String {
            switch self {
            case .primary: return "tray.fill"
            case .school:  return "graduationcap.fill"
            case .social:  return "person.2.fill"
            case .updates: return "bell.fill"
            }
        }

        var color: Color {
            switch self {
            case .primary: return .white
            case .school:  return Color.canvasRed
            case .social:  return Color.mailBlue
            case .updates: return Color.reminderOrange
            }
        }
    }

    var timeAgo: String {
        let diff = Date.now.timeIntervalSince(date)
        if diff < 3600 { return "\(Int(diff / 60))m ago" }
        if diff < 86400 { return "\(Int(diff / 3600))h ago" }
        let days = Int(diff / 86400)
        return days == 1 ? "Yesterday" : "\(days)d ago"
    }
}
