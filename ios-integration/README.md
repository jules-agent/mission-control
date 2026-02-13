# IdentityKit - iOS Integration

Swift library for integrating Master Identity System into iOS apps.

## Installation

1. Copy `IdentityKit.swift` into your Xcode project
2. Add to your target's Build Phases → Compile Sources

## Quick Start

```swift
import IdentityKit

// Initialize the client
let identityKit = IdentityKit(baseURL: "https://jules3000.com")

// Fetch user's identities
let identities = try await identityKit.fetchIdentities(userId: currentUserId)

// Get full identity with categories and influences
let (identity, categories, influences) = try await identityKit.fetchIdentity(id: identityId)

// Match influences based on context
let context = MatchContext(
    mood: "mellow",
    timeOfDay: "morning",
    songType: "inspiration",
    categoryTypes: ["music"]
)

let matches = try await identityKit.matchInfluences(
    identityId: identity.id,
    context: context,
    count: 10
)

// Use matched influences
for influence in matches {
    print("\(influence.name) - \(influence.alignmentPercentage) match")
}
```

## SwiftUI Example

```swift
import SwiftUI
import IdentityKit

struct SongSelectionView: View {
    @State private var matches: [Influence] = []
    let identityKit = IdentityKit()
    
    var body: some View {
        List(matches) { influence in
            HStack {
                Text(influence.name)
                Spacer()
                Text(influence.alignmentPercentage)
                    .foregroundColor(influence.alignmentColor)
            }
        }
        .task {
            await loadMatches()
        }
    }
    
    func loadMatches() async {
        do {
            let context = MatchContext(
                mood: getCurrentMood(),
                timeOfDay: getTimeOfDay(),
                songType: "inspiration",
                categoryTypes: ["music"]
            )
            
            matches = try await identityKit.matchInfluences(
                identityId: UserDefaults.standard.string(forKey: "identity_id")!,
                context: context,
                count: 20
            )
        } catch {
            print("Error loading matches: \(error)")
        }
    }
}
```

## API Endpoints

### GET /api/identity?id={id}
Fetch a single identity with all categories and influences.

**Response:**
```json
{
  "identity": { ... },
  "categories": [ ... ],
  "influences": [ ... ]
}
```

### GET /api/identity?user_id={userId}
Fetch all identities for a user.

**Response:**
```json
{
  "identities": [ ... ]
}
```

### POST /api/identity/match
Match influences based on context and preferences.

**Request:**
```json
{
  "identity_id": "uuid",
  "context": {
    "mood": "mellow",
    "time_of_day": "morning",
    "song_type": "inspiration",
    "category_types": ["music"]
  },
  "count": 10
}
```

**Response:**
```json
{
  "matches": [
    {
      "id": "uuid",
      "name": "Radiohead",
      "alignment": 95.5,
      "match_score": 87.3,
      "mood_tags": ["mellow", "atmospheric"],
      ...
    }
  ]
}
```

## Integration with Life's Soundtrack

```swift
// In your song generation logic:

func selectArtistsForMood(_ mood: String) async throws -> [String] {
    let context = MatchContext(
        mood: mood,
        timeOfDay: getTimeOfDay(),
        songType: currentSongType,
        categoryTypes: ["music"]
    )
    
    let matches = try await identityKit.matchInfluences(
        identityId: currentIdentityId,
        context: context,
        count: 5
    )
    
    // Filter above serving threshold (already done by API)
    return matches.map { $0.name }
}
```

## Serving Threshold

The API automatically filters influences below 60% alignment. Only influences that meet the serving threshold will be returned.

## Recency Tracking

The matching algorithm considers play history from the last 20 days:
- 0-5 days: 0.7x score penalty
- 6-10 days: 0.9x score penalty  
- 11-20 days: 1.0x (no penalty)
- Unplayed: 1.5x boost

## Alignment Color Coding

```swift
influence.alignmentColor // SwiftUI Color
- >= 60%: Green
- >= 40%: Yellow
- < 40%: Red
```

## Error Handling

```swift
do {
    let matches = try await identityKit.matchInfluences(...)
} catch {
    // Handle network errors, decoding errors, etc.
    print("Error: \(error.localizedDescription)")
}
```

## Requirements

- iOS 15.0+
- Swift 5.5+
- Foundation framework

## License

MIT
