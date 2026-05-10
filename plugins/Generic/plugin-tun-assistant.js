/* 触发器 手动触发 */
const onRun = async () => {
  const envStore = Plugins.useEnvStore()
  const { os } = envStore.env

  const common = ['Frequently Asked Questions:', '- No network: Please replace the tun stack', '- SSL error: Please manually set the system DNS to 223.5.5.5 or 8.8.8.8']
  if (os === 'windows') {
  const arr = ['1. Please go to settings and enable run as administrator', '2. Exit the program and reopen it (do not use reboot)', '3. Modify the configuration and enable TUN mode', '4. Start the kernel\n'].concat(common)    await Plugins.alert(Plugin.name, arr.join('\n'))
    return
  }

  const stable = await getKernelFilePath()
  const alpha = await getKernelFilePath(true)

  if (os === 'linux') {
    const arr = [
      '1、Copy the following commands',
      '',
      `sudo setcap cap_net_bind_service,cap_net_admin,cap_dac_override=+ep ${stable}`,
      `sudo setcap cap_net_bind_service,cap_net_admin,cap_dac_override=+ep ${alpha}`,
      '',
      '2、Open the terminal and execute the above command.',
      '3、Modify the configuration to enable TUN mode.',
      '4、Start the kernel\n'
    ].concat(common)
    await Plugins.alert(Plugin.name, arr.join('\n'))
    return
  }

  if (os === 'darwin') {
    const arr = [
      '1、Copy the following commands',
      '',
      `osascript -e 'do shell script "chown root:admin ${stable}\\nchmod +sx ${stable}" with administrator privileges'`,
      `osascript -e 'do shell script "chown root:admin ${alpha}\\nchmod +sx ${alpha}" with administrator privileges'`,
      '',
      '2、Open the terminal and execute the above command.',
      '3、Modify the configuration to enable TUN mode.',
      '4、Start the kernel\n'
    ].concat(common)
    await Plugins.alert(Plugin.name, arr.join('\n'))
  }
}

async function getKernelFilePath(isAlpha = false) {
  const bin = Plugins.getKernelFileName(isAlpha)
  // GFC
  if (Plugins.APP_TITLE.includes('Clash')) {
    return await Plugins.AbsolutePath(`data/mihomo/${bin}`)
  }

  // GFS
  return await Plugins.AbsolutePath(`data/sing-box/${bin}`)
}
