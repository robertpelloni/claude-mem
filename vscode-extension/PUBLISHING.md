# Publishing the Claude-Mem VS Code Extension

This extension provides an interface to Claude-Mem natively inside VS Code, including inline memory annotations and a memory browser panel.

## Prerequisites

1.  **Azure DevOps Organization / Personal Access Token (PAT):**
    Visual Studio Marketplace uses Azure DevOps for authentication. You need a PAT with the `Marketplace (Publish)` scope.
2.  **VSCE CLI:**
    Ensure you have the latest version of `vsce` installed (`npm i -g @vscode/vsce`).

## Publishing Steps

1.  **Build the Extension:**
    Run the build process to ensure `dist/` is populated and all errors are cleared.
    ```bash
    cd vscode-extension
    npm run build
    ```

2.  **Package it (Optional):**
    If you want to test the built extension locally before publishing, generate a `.vsix` file.
    ```bash
    npm run package
    ```
    This creates a `claude-mem-vscode-X.Y.Z.vsix` file. You can install it in VS Code via the "Extensions: Install from VSIX..." command.

3.  **Login to Publisher Namespace:**
    Log in using your Azure DevOps PAT. The publisher in `package.json` is `thedotmack`.
    ```bash
    vsce login thedotmack
    ```

4.  **Publish:**
    Publish directly to the VS Code Marketplace.
    ```bash
    npm run publish
    ```

## Versioning

Remember to bump the version in `package.json` before running `npm run package` or `npm run publish`.
