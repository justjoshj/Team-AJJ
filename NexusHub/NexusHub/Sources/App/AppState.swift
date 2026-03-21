import SwiftUI
import Combine

class AppState: ObservableObject {
    @Published var selectedTab: Tab = .dashboard
    @Published var unreadCounts: UnreadCounts = UnreadCounts()

    enum Tab: Int, CaseIterable {
        case dashboard = 0
        case canvas
        case mail
        case calendar
        case reminders

        var title: String {
            switch self {
            case .dashboard:  return "Hub"
            case .canvas:     return "Canvas"
            case .mail:       return "Mail"
            case .calendar:   return "Calendar"
            case .reminders:  return "Reminders"
            }
        }

        var icon: String {
            switch self {
            case .dashboard:  return "square.grid.2x2.fill"
            case .canvas:     return "book.pages.fill"
            case .mail:       return "envelope.fill"
            case .calendar:   return "calendar"
            case .reminders:  return "checkmark.circle.fill"
            }
        }

        var accentColor: Color {
            switch self {
            case .dashboard:  return .white
            case .canvas:     return Color.canvasRed
            case .mail:       return Color.mailBlue
            case .calendar:   return Color.calendarGreen
            case .reminders:  return Color.reminderOrange
            }
        }
    }

    struct UnreadCounts {
        var canvas: Int = 3
        var mail: Int = 7
        var calendar: Int = 2
        var reminders: Int = 5

        var total: Int { canvas + mail + calendar + reminders }
    }
}

extension Color {
    static let canvasRed      = Color(red: 0.92, green: 0.26, blue: 0.21)
    static let mailBlue       = Color(red: 0.20, green: 0.53, blue: 0.99)
    static let calendarGreen  = Color(red: 0.20, green: 0.80, blue: 0.55)
    static let reminderOrange = Color(red: 1.00, green: 0.58, blue: 0.00)

    static let surfacePrimary   = Color(white: 1.0, opacity: 0.07)
    static let surfaceSecondary = Color(white: 1.0, opacity: 0.04)
    static let borderSubtle     = Color(white: 1.0, opacity: 0.10)
}
