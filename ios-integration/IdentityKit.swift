import Foundation

// MARK: - Models

public struct Identity: Codable, Identifiable {
    public let id: String
    public let userId: String
    public let name: String
    public let isBase: Bool
    public let parentId: String?
    public let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name
        case isBase = "is_base"
        case parentId = "parent_id"
        case createdAt = "created_at"
    }
}

public struct Category: Codable, Identifiable {
    public let id: String
    public let identityId: String
    public let parentId: String?
    public let name: String
    public let type: String
    public let level: Int
    
    enum CodingKeys: String, CodingKey {
        case id
        case identityId = "identity_id"
        case parentId = "parent_id"
        case name, type, level
    }
}

public struct Influence: Codable, Identifiable {
    public let id: String
    public let categoryId: String
    public let name: String
    public let alignment: Double
    public let position: Int
    public let moodTags: [String]
    public let metadata: [String: AnyCodable]?
    public var matchScore: Double?
    
    enum CodingKeys: String, CodingKey {
        case id
        case categoryId = "category_id"
        case name, alignment, position
        case moodTags = "mood_tags"
        case metadata
        case matchScore = "match_score"
    }
    
    public var alignmentPercentage: String {
        String(format: "%.1f%%", alignment)
    }
    
    public var alignmentColor: Color {
        if alignment >= 60 { return .green }
        if alignment >= 40 { return .yellow }
        return .red
    }
}

public struct MatchContext: Codable {
    public let mood: String?
    public let timeOfDay: String?
    public let songType: String?
    public let categoryTypes: [String]?
    
    enum CodingKeys: String, CodingKey {
        case mood
        case timeOfDay = "time_of_day"
        case songType = "song_type"
        case categoryTypes = "category_types"
    }
    
    public init(mood: String? = nil, timeOfDay: String? = nil, songType: String? = nil, categoryTypes: [String]? = ["music"]) {
        self.mood = mood
        self.timeOfDay = timeOfDay
        self.songType = songType
        self.categoryTypes = categoryTypes
    }
}

// MARK: - API Client

public class IdentityKit {
    private let baseURL: String
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    
    public init(baseURL: String = "https://jules3000.com") {
        self.baseURL = baseURL
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
    }
    
    // MARK: - Identity Methods
    
    public func fetchIdentity(id: String) async throws -> (identity: Identity, categories: [Category], influences: [Influence]) {
        let url = URL(string: "\(baseURL)/api/identity?id=\(id)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        
        let response = try decoder.decode(IdentityResponse.self, from: data)
        return (response.identity, response.categories, response.influences)
    }
    
    public func fetchIdentities(userId: String) async throws -> [Identity] {
        let url = URL(string: "\(baseURL)/api/identity?user_id=\(userId)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        
        let response = try decoder.decode(IdentitiesResponse.self, from: data)
        return response.identities
    }
    
    // MARK: - Matching Methods
    
    public func matchInfluences(identityId: String, context: MatchContext, count: Int = 10) async throws -> [Influence] {
        let url = URL(string: "\(baseURL)/api/identity/match")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "identity_id": identityId,
            "context": [
                "mood": context.mood as Any,
                "time_of_day": context.timeOfDay as Any,
                "song_type": context.songType as Any,
                "category_types": context.categoryTypes as Any
            ],
            "count": count
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try decoder.decode(MatchResponse.self, from: data)
        return response.matches
    }
    
    // MARK: - Play History
    
    public func recordPlay(identityId: String, influenceId: String, context: MatchContext) async throws {
        // This would call a play_history endpoint
        // Implementation depends on your backend setup
    }
}

// MARK: - Response Types

private struct IdentityResponse: Codable {
    let identity: Identity
    let categories: [Category]
    let influences: [Influence]
}

private struct IdentitiesResponse: Codable {
    let identities: [Identity]
}

private struct MatchResponse: Codable {
    let matches: [Influence]
}

// MARK: - Helper Types

public struct AnyCodable: Codable {
    public let value: Any
    
    public init(_ value: Any) {
        self.value = value
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            value = dictionary.mapValues { $0.value }
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported type")
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch value {
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dictionary as [String: Any]:
            try container.encode(dictionary.mapValues { AnyCodable($0) })
        default:
            throw EncodingError.invalidValue(value, EncodingError.Context(codingPath: encoder.codingPath, debugDescription: "Unsupported type"))
        }
    }
}

// MARK: - SwiftUI Integration

#if canImport(SwiftUI)
import SwiftUI

extension Influence {
    public var alignmentColor: Color {
        if alignment >= 60 { return .green }
        if alignment >= 40 { return .yellow }
        return .red
    }
}
#endif
