/**
 * 本插件使用项目：https://github.com/mozilla/twemoji-colr
 */

const SRC_URL = 'https://github.com/mozilla/twemoji-colr/releases/download/v0.7.0/Twemoji.Mozilla.ttf'
const DST_FILE = 'C:/WINDOWS/Fonts/Twemoji.Mozilla.ttf'
const TMP_FILE = 'data/.cache/Twemoji.Mozilla.ttf'

/* 触发器 手动触发 */
const onRun = async () => {
  const envStore = Plugins.useEnvStore()

  if (envStore.env.os !== 'windows') {
    throw 'Non-Windows systems are not supported.'
  }

  const exists = await Plugins.FileExists(DST_FILE)
  if (!exists) {
    await installFont()
    if (await Plugins.confirm('The prompt asks whether to restart the client immediately for the font to take effect？')) {
      await Plugins.RestartApp()
    }
    return
  }

  if (await Plugins.confirm('The system detected that this font is already installed. Do you want to uninstall it?')) {
    await uninstallFont()
  }
}

const installFont = async () => {
  let downloadOK = true
  if (!(await Plugins.FileExists(TMP_FILE))) {
    const { update, success, error, destroy } = Plugins.message.info('Downloading fonts...', 5 * 60 * 1000)
    try {
      await Plugins.Download(SRC_URL, TMP_FILE, {}, (c, t) => {
        update('Downloading fonts...' + ((c / t) * 100).toFixed(2) + '%')
      })
      success('Download complete')
    } catch (e) {
      console.log(`[${Plugin.name}]`, e)
      error(e.message || e)
      downloadOK = false
    } finally {
      await Plugins.sleep(1000)
      destroy()
    }
  }

  if (!downloadOK) return

  await Plugins.CopyFile(TMP_FILE, DST_FILE)
  await Plugins.Exec('reg', [
    'add',
    'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts',
    '/v',
    'Twemoji.Mozilla.ttf',
    '/t',
    'REG_SZ',
    '/d',
    'Twemoji.Mozilla.ttf',
    '/f'
  ])
  Plugins.message.success('Installation complete.')
}

const uninstallFont = async () => {
  let uninstallOK = true
  await Plugins.RemoveFile(DST_FILE).catch((e) => {
    uninstallOK = false
    if (e.includes('The process cannot access the file because it is being used by another process.')) {
      Plugins.alert('Hint', 'Please exit this program and uninstall it using the system font management program.')
    }
  })

  if (!uninstallOK) return

  await Plugins.Exec('reg', ['delete', 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts', '/v', 'Twemoji.Mozilla.ttf', '/f'])
  Plugins.message.success('Uninstallation complete')
}
