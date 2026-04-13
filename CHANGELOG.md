# Changelog

## Badge System Rework (2026-04-04)

### Bug Fixes
- **Slot 0 drag bug**: Dragging from slot 0 no longer causes badges to disappear. The root cause was `'0'` being falsy in JavaScript, which made the drop handler take the wrong code path and overwrite the target badge.
- **Badge duplication**: Fixed badges appearing in multiple slots when dragging in the InfoStand. The issue was a stale props fallback — after a drag operation, the hook updated correctly but the component fell back to old server props for empty slots, showing ghost copies.
- **Race condition**: Replaced single boolean `localChangeRef` with a counter (`pendingUpdatesRef`) to correctly handle rapid sequential drag operations without the server overwriting local state.
- **Badge deduplication**: `toFixedSlots()` now deduplicates badges, preventing the same badge from appearing in multiple slots even if the server returns duplicates.
- **Server badge dedup in InfoStand**: `RoomSessionUserBadgesEvent` handler now deduplicates badges from the server before updating the avatar info.

### Drag & Drop Visual Feedback
- **Custom drag preview**: Badge image is used as the drag ghost instead of the browser default (via `setDragImage`).
- **Source opacity**: The dragged item becomes semi-transparent (`opacity-40`) during drag.
- **Pulsing glow on drop targets**: Valid drop targets pulse with a blue glow animation (`animate-pulse-glow`).
- **Drop settle animation**: A brief scale-down animation (`animate-drop-settle`, 300ms) plays when a badge lands in a slot.
- **Remove indicator**: Dragging an active badge over the inventory area shows a red pulsing background with a trash icon overlay.
- **Grab cursor**: All draggable badge elements now show `cursor-grab` / `cursor-grabbing`.

### Sparse Slot Support
- `activeBadgeCodes` changed from compact `string[]` to fixed-size `(string | null)[]` array. Empty slots are `null` instead of being collapsed, allowing gaps between badges.
- All operations (`setBadgeAtSlot`, `removeBadge`, `reorderBadges`, `swapBadges`, `toggleBadge`) work on the fixed-size array without compaction.

### New Badge Glow (Feature)
- Unseen (newly received) badges in the inventory now pulse with a **gold glow** (`animate-pulse-glow-gold`) instead of the previous flat green background.
- The glow disappears when the badge is selected (unseen status cleared).

### Badge Received Toast Notification (Feature)
- When a new badge is received, a bubble notification appears with:
  - Badge image and localized name
  - **"Indossa" / "Wear"** button that directly equips the badge via `toggleBadge` and closes the notification
  - **"Non ora" / "Later"** link to dismiss
- Auto-fades after 8 seconds (standard bubble behavior).
- Uses the existing `NotificationBubbleType.BADGE_RECEIVED` (was defined but unused).
- New component: `NotificationBadgeReceivedBubbleView`.

### Dynamic Badge Slot Count
- Badge slot count is now fully driven by `user.badges.max.slots` config (default: 5).
  - **5 slots**: 5 badge slots + group badge in InfoStand (6 boxes total)
  - **6 slots**: 6 badge slots, group badge is replaced by the 6th slot
- Both the inventory grid and InfoStand layout adapt automatically.
- Removed all hardcoded `maxSlots = 5` references.

### InfoStand Double-Click to Remove
- Double-clicking a badge in the InfoStand removes it from active badges (own user only).

### Localization
- Added `notification.badge.received` key:
  - IT: "Nuovo Distintivo!"
  - EN: "New Badge!"
- Located in `public/nitro-assets/config/UITexts.json` and `UITexts_en.json`.

### Files Modified
| File | Changes |
|------|---------|
| `src/hooks/inventory/useInventoryBadges.ts` | Sparse slots, dedup, race condition fix, toFixedSlots |
| `src/hooks/notification/useNotification.ts` | BadgeReceivedEvent listener |
| `src/components/inventory/views/badge/InventoryBadgeView.tsx` | Visual feedback, dynamic maxSlots, fix '0' falsy |
| `src/components/inventory/views/badge/InventoryBadgeItemView.tsx` | Drag preview, opacity, cursor |
| `src/components/room/widgets/avatar-info/infostand/InfoStandBadgeSlotView.tsx` | Visual feedback, double-click remove, no stale props |
| `src/components/room/widgets/avatar-info/infostand/InfoStandWidgetUserView.tsx` | Dynamic layout, server badge dedup |
| `src/components/notification-center/views/bubble-layouts/GetBubbleLayout.tsx` | BADGE_RECEIVED routing |
| `src/components/notification-center/views/bubble-layouts/NotificationBadgeReceivedBubbleView.tsx` | New component |
| `src/layout/InfiniteGrid.tsx` | Gold glow for unseen items |
| `tailwind.config.js` | Custom keyframes and animations |

### Configuration
```json
{
  "user.badges.max.slots": 5
}
```
Set to `6` to replace the group badge slot with a 6th badge slot.
