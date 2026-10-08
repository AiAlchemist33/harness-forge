---
name: notify
description: Desktop notification when Claude needs your attention
event: Notification
matcher: ""
platforms: [windows, macos, linux]
recommended-for: everyone
---

# Desktop Notification

Sends a system notification when Claude needs your attention (permission prompt, idle, etc.).

## Config by platform

### macOS
```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code needs your attention\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

### Linux
```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "notify-send 'Claude Code' 'Needs your attention' --icon=dialog-information"
          }
        ]
      }
    ]
  }
}
```

### Windows (PowerShell toast)
```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -Command \"[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime] | Out-Null; $xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent(0); $xml.GetElementsByTagName('text')[0].AppendChild($xml.CreateTextNode('Claude Code needs your attention')) | Out-Null; [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Claude Code').Show([Windows.UI.Notifications.ToastNotification]::new($xml))\""
          }
        ]
      }
    ]
  }
}
```

### Windows (BurntToast — simpler, requires `Install-Module BurntToast`)
```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -Command \"New-BurntToastNotification -Text 'Claude Code', 'Needs your attention'\""
          }
        ]
      }
    ]
  }
}
```
