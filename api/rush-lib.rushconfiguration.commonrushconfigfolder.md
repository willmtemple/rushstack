[Home](./index) &gt; [@microsoft/rush-lib](./rush-lib.md) &gt; [RushConfiguration](./rush-lib.rushconfiguration.md) &gt; [commonRushConfigFolder](./rush-lib.rushconfiguration.commonrushconfigfolder.md)

# RushConfiguration.commonRushConfigFolder property

The folder where Rush's additional config files are stored. This folder is always a subfolder called "config\\rush" inside the common folder. (The "common\\config" folder is reserved for configuration files used by other tools.) To avoid confusion or mistakes, Rush will report an error if this this folder contains any unrecognized files.

Example: "C:\\MyRepo\\common\\config\\rush"

**Signature:**
```javascript
commonRushConfigFolder: string
```