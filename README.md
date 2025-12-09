# VerifyWise Plugin Marketplace

Official plugin registry for [VerifyWise](https://verifywise.ai) - the AI Governance platform.

## Available Plugins

No plugins are currently published. Check back soon or contribute your own!

## Installing Plugins

1. Go to **Settings > Plugins** in your VerifyWise instance
2. Browse available plugins in the Marketplace tab
3. Click **Install** on the plugin you want
4. Configure the plugin settings
5. Enable the plugin

## Creating Your Own Plugin

See the [`templates`](./templates) directory for plugin development templates:

| Template | Description |
|----------|-------------|
| [template-basic-plugin](./templates/template-basic-plugin) | Simple plugin with lifecycle hooks and event handlers |
| [template-custom-page](./templates/template-custom-page) | Plugin with a custom page in the sidebar |
| [template-iframe-page](./templates/template-iframe-page) | Embed external content via iframe |
| [template-notification-sender](./templates/template-notification-sender) | Send notifications to external services |
| [template-webhook-receiver](./templates/template-webhook-receiver) | Receive and process webhooks |

### Quick Start

```bash
# Clone this repository
git clone https://github.com/bluewave-labs/plugin-marketplace.git

# Copy a template to start your plugin
cp -r templates/template-basic-plugin plugins/my-plugin

# Edit the manifest and code
code plugins/my-plugin

# Test locally by copying to your VerifyWise installation
cp -r plugins/my-plugin /path/to/verifywise/Servers/plugins/marketplace/
```

## Repository Structure

```
plugin-marketplace/
├── README.md              # This file
├── registry.json          # Plugin registry (auto-fetched by VerifyWise)
├── plugins/               # Published plugins
│   └── .gitkeep           # (empty - plugins coming soon)
└── templates/             # Development templates (not in registry)
    ├── README.md          # Plugin development guide
    ├── template-basic-plugin/
    ├── template-custom-page/
    ├── template-iframe-page/
    ├── template-notification-sender/
    └── template-webhook-receiver/
```

## Contributing a Plugin

1. Fork this repository
2. Create your plugin in `plugins/your-plugin-name/`
3. Add your plugin to `registry.json`
4. Create a zip file: `cd plugins && zip -r your-plugin-name.zip your-plugin-name/`
5. Submit a pull request

### Registry Entry Format

```json
{
  "id": "your-plugin-name",
  "name": "Your Plugin Name",
  "description": "Brief description of what your plugin does",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "url": "https://your-website.com"
  },
  "type": "integration|feature|framework|reporting",
  "tags": ["tag1", "tag2"],
  "download": "https://raw.githubusercontent.com/bluewave-labs/plugin-marketplace/main/plugins/your-plugin-name.zip",
  "checksum": "sha256:...",
  "compatibility": {
    "minVersion": "1.6.0"
  },
  "permissions": ["events:listen", "database:read"]
}
```

## Plugin Types

| Type | Description |
|------|-------------|
| `integration` | Connect with external services (Slack, Jira, etc.) |
| `feature` | Add new functionality (audit trail, analytics) |
| `framework` | Compliance frameworks (GDPR, ISO 27001, SOC2) |
| `reporting` | Report generation and export |

## License

MIT
