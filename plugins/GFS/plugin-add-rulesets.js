const onRun = async () => {
const ok = await Plugins.confirm('Prompt', '> It is recommended to add rules using the Rule Set Center. Please go to: `Rule Set` - `Rule Set Center`', {

type: 'markdown',
okText: 'Okay, I\'ll try',
cancelText: 'No need'

}).catch(() => false)

  if (ok) return

  const rulesetsStore = Plugins.useRulesetsStore()

  const list = [
    // Built-In
    {
      id: 'direct',
      tag: 'direct',
      updateTime: '',
      type: 'Manual',
      format: 'source',
      url: '',
      path: 'data/rulesets/direct.json',
      count: 0,
      disabled: false
    },
    {
      id: 'reject',
      tag: 'reject',
      updateTime: '',
      type: 'Manual',
      format: 'source',
      url: '',
      path: 'data/rulesets/reject.json',
      count: 0,
      disabled: false
    },
    {
      id: 'proxy',
      tag: 'proxy',
      updateTime: '',
      type: 'Manual',
      format: 'source',
      url: '',
      path: 'data/rulesets/proxy.json',
      count: 0,
      disabled: false
    },
    // https://github.com/MetaCubeX/meta-rules-dat/tree/sing
    {
      id: 'remote-reject',
      tag: 'List of advertising domains',
      updateTime: '',
      type: 'Http',
      format: 'binary',
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/category-ads-all.srs',
      path: 'data/rulesets/remote-category-ads-all.srs',
      count: 0,
      disabled: false
    },
    {
      id: 'remote-private',
      tag: 'List of private network domain names',
      updateTime: '',
      type: 'Http',
      format: 'binary',
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/private.srs',
      path: 'data/rulesets/remote-private.srs',
      count: 0,
      disabled: false
    },
    {
      id: 'remote-apple',
      tag: 'Apple List of domain names that can be directly accessed in mainland China',
      updateTime: '',
      type: 'Http',
      format: 'binary',
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/apple-cn.srs',
      path: 'data/rulesets/remote-apple-cn.srs',
      count: 0,
      disabled: false
    },
    {
      id: 'remote-icloud',
      tag: 'iCloud List of domain names that can be directly accessed in mainland China',
      updateTime: '',
      type: 'Http',
      format: 'binary',
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/icloud@cn.srs',
      path: 'data/rulesets/remote-icloud-cn.srs',
      count: 0,
      disabled: false
    },
    {
      id: 'remote-gfw',
      tag: 'GFW Domain List',
      updateTime: '',
      type: 'Http',
      format: 'binary',
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/gfw.srs',
      path: 'data/rulesets/remote-gfw.srs',
      count: 0,
      disabled: false
    },
    {
      id: 'remote-tld-not-cn',
      tag: 'List of top-level domains used outside mainland China',
      updateTime: '',
      type: 'Http',
      format: 'binary',
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/tld-!cn.srs',
      path: 'data/rulesets/remote-tld-not-cn.srs',
      count: 0,
      disabled: false
    },
    {
      id: 'remote-telegram-cidr',
      tag: 'List of IP addresses used by Telegram',
      updateTime: '',
      type: 'Http',
      format: 'binary',
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/telegram.srs',
      path: 'data/rulesets/remote-telegram-cidr.srs',
      count: 0,
      disabled: false
    },
    {
      id: 'remote-lan-cidr',
      tag: 'List of LAN IP addresses and reserved IP addresses',
      updateTime: '',
      type: 'Http',
      format: 'binary',
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/private.srs',
      path: 'data/rulesets/remote-private-cidr.srs',
      count: 0,
      disabled: false
    },
    {
      id: 'remote-cn-cidr',
      tag: 'List of IP addresses in mainland China',
      updateTime: '',
      type: 'Http',
      format: 'binary',
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/cn.srs',
      path: 'data/rulesets/remote-cn-cidr.srs',
      count: 0,
      disabled: false
    },
    {
      id: 'remote-cn',
      tag: 'List of domain names in mainland China',
      updateTime: '',
      type: 'Http',
      format: 'binary',
      url: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/cn.srs',
      path: 'data/rulesets/remote-cn.srs',
      count: 0,
      disabled: false
    },
    {
      id: 'geoip-ru',
      tag: 'List of IP-addresses in Russia',
      updateTime: '',
      type: 'Http',
      format: 'binary',
      url: 'https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geoip/ru.srs',
      path: 'data/rulesets/geoip-ru.srs',
      count: 0,
      disabled: false
    },
    {
      id: 'geosite-ru',
      tag: 'List of domain names in Russia',
      updateTime: '',
      type: 'Http',
      format: 'binary',
      url: 'https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/category-ru.srs',
      path: 'data/rulesets/category-ru.srs',
      count: 0,
      disabled: false
    },
    {
      id: 'geoip-ru-blocked',
      tag: 'List of blocked IP-addresses in Russia',
      updateTime: '',
      type: 'Http',
      format: 'binary',
      url: 'https://raw.githubusercontent.com/runetfreedom/russia-v2ray-rules-dat/release/sing-box/rule-set-geoip/geoip-ru-blocked.srs',
      path: 'data/rulesets/geoip-ru-blocked.srs',
      count: 0,
      disabled: false
    },
    {
      id: 'geosite-ru-blocked',
      tag: 'List of blocked domains in Russia',
      updateTime: '',
      type: 'Http',
      format: 'binary',
      url: 'https://raw.githubusercontent.com/runetfreedom/russia-v2ray-rules-dat/release/sing-box/rule-set-geosite/geosite-ru-blocked.srs',
      path: 'data/rulesets/geosite-ru-blocked.srs',
      count: 0,
      disabled: false
    }
  ]

  const ids = await Plugins.picker.multi(
    'Please select the rule set you want to add.',
    list.map((v) => ({ label: v.tag, value: v.id })),
    list.filter((v) => rulesetsStore.getRulesetById(v.id)).map((v) => v.id)
  )

  for (let i = 0; i < ids.length; i++) {
    if (!rulesetsStore.getRulesetById(ids[i])) {
      const ruleset = list.find((v) => v.id == ids[i])
      await rulesetsStore.addRuleset(ruleset)
      console.log('Add to', ruleset.tag)
    }
  }

  if (ids.includes('direct') && !(await Plugins.FileExists('data/rulesets/direct.json'))) {
    Plugins.WriteFile('data/rulesets/direct.json', '{\n  "version": 1,\n  "rules": []\n}')
  }
  if (ids.includes('reject') && !(await Plugins.FileExists('data/rulesets/reject.json'))) {
    Plugins.WriteFile('data/rulesets/reject.json', '{\n  "version": 1,\n  "rules": []\n}')
  }
  if (ids.includes('proxy') && !(await Plugins.FileExists('data/rulesets/proxy.json'))) {
    Plugins.WriteFile('data/rulesets/proxy.json', '{\n  "version": 1,\n  "rules": []\n}')
  }

  Plugins.message.success('Added')
}
