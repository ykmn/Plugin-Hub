/** @type {EsmPlugin} */
export default (Plugin) => {
  const ui_id = Plugin.id + '_ui'
  const appStore = Plugins.useAppStore()

  const add_UI = () => {
    appStore.removeCustomActions('profiles_header', [ui_id])
    appStore.addCustomActions('profiles_header', {
      id: ui_id,
      component: 'Button',
      componentProps: {
        type: 'link',
        onClick: showUI
      },
      componentSlots: {
        default: 'Quick Configuration Wizard'
      }
    })
  }

  const del_UI = () => {
    appStore.removeCustomActions('profiles_header', [ui_id])
  }

  /* 触发器 手动触发 */
  const onRun = async () => {
    showUI()
  }

  /* 触发器 APP就绪后 */
  const onReady = async () => {
    add_UI()
  }

  const onDispose = () => {
    del_UI()
  }

  const showUI = () => {
    const { h, ref, watch, computed, resolveComponent } = Vue

    const currentStep = ref(0)
    const isDirectIPv6Enabled = ref(false)
    const isProxyIPv6Enabled = ref(false)
    const isAllowLanEnabled = ref(false)
    const lanPort = ref()
    const isTUNEnabled = ref(false)
    const isFakeIPEnabled = ref(false)
    const isBanQUICEnabled = ref(true)
    const isDohEnabled = ref(true)

    const name = ref(Plugins.sampleID())
    const subsMap = ref({})
    const subsRef = ref([])

    const isSupportIPv6 = ref()
    watch(currentStep, async (step) => {
      if (step === 1) {
        isSupportIPv6.value = undefined
        isSupportIPv6.value = await checkIPv6Support()
      }
    })

    const component = {
      template: `
    <div>
      <Progress :percent="(currentStep / 7) * 100" />
      <div v-if="currentStep === 0">
        <div class="text-32 py-8 font-bold">Welcome to the Quick Configuration Wizard</div>
        <p>This wizard can help you generate an error-free configuration. Please proceed before starting：</p>
        <ul>
          <li class="my-16">Close all proxy software (to avoid affecting IPv6 detection)</li>
          <li class="my-16">Enable the IPv6 protocol stack on the router and your local machine (to avoid affecting IPv6 detection)</li>
          <li class="my-16">If you have disabled Windows' Smart Multihomed DNS resolution, please restore it (to avoid affecting TUN mode)</li>
        </ul>
      </div>
      <div v-if="currentStep === 1" class="flex flex-col gap-8">
        <div class="text-32 py-8 font-bold">Does a direct website connection require IPv6?</div>
        <Tag v-if="isSupportIPv6 === undefined">Detecting your network environment...</Tag>
        <Tag v-else-if="isSupportIPv6" color="green">Note: Your network environment already supports IPv6; enabling it is recommended! Accessing domestic websites will provide a better experience!</Tag>
        <Tag v-else color="red">Note: Your network environment does not support IPv6. It is recommended to disable it! Forcing it to work will cause some websites to be inaccessible!</Tag>
        <div class="flex gap-8">
          <Card @click="isDirectIPv6Enabled = true" :selected="isDirectIPv6Enabled" title="Required" class="flex-1" subtitle="Prioritize accessing directly connected websites via IPv6"/>
          <Card @click="isDirectIPv6Enabled = false" :selected="!isDirectIPv6Enabled" title="Not Required" class="flex-1" subtitle="Accessing directly connected websites using only IPv4" />
        </div>
      </div>

      <div v-if="currentStep === 2" class="flex flex-col gap-8">
        <div class="text-32 py-8 font-bold">Do proxy websites require IPv6?</div>
        <Tag>If you are a self-hosted user and the node supports IPv6, please select Required; if you are an airport user, the node usually does not support IPv6, please select Not Required.</Tag>
        <div class="flex gap-8">
          <Card @click="isProxyIPv6Enabled = true" :selected="isProxyIPv6Enabled" title="Required" class="flex-1" selected subtitle="Prioritize accessing the proxied website via IPv6" />
          <Card @click="isProxyIPv6Enabled = false" :selected="!isProxyIPv6Enabled" title="Not Required" class="flex-1" subtitle="Proxy access uses only IPv4" />
        </div>
      </div>

      <div v-if="currentStep === 3" class="flex flex-col gap-8">
        <div class="text-32 py-8 font-bold">Do I need a proxy for my LAN devices?</div>
        <Tag>Normally you don't need to enable this option.</Tag>
        <div class="flex gap-8">
          <Card @click="isAllowLanEnabled = true" :selected="isAllowLanEnabled" title="Required" class="flex-1" selected subtitle="Inbound proxy will listen to all local area network addresses" />
          <Card @click="isAllowLanEnabled = false" :selected="!isAllowLanEnabled" title="Not Required" class="flex-1" subtitle="Inbound proxies only listen on the local machine address" />
        </div>
        <template v-if="isAllowLanEnabled">
          <h4>If you want to customize the open ports, please fill in:</h4>
          <Input v-model="lanPort" placeholder="Please enter the port number" />
        </template>
      </div>

      <div v-if="currentStep === 4" class="flex flex-col gap-8">
        <div class="text-32 py-8 font-bold">Should TUN mode be enabled?</div>
        <Tag>Once enabled, a new virtual network adapter will be created, and all software traffic will be forwarded through the core.</Tag>
        <div class="flex gap-8">
          <Card @click="isTUNEnabled = true" :selected="isTUNEnabled" title="Required" class="flex-1" selected subtitle="All traffic will pass through the virtual network interface card and be forwarded by the core." />
          <Card @click="isTUNEnabled = false" :selected="!isTUNEnabled" title="Not Required" class="flex-1" subtitle="Unable to proxy software that does not follow the system's proxy rules" />
        </div>
        <div v-if="isTUNEnabled">
          <p>注意事项</p>
          <ul class="text-14">
            <li class="my-16">Enabling TUN mode on Windows requires administrator privileges. On Linux/macOS, manual authorization is required via Settings > Kernel (this manual authorization is required after each kernel update).</li>
            <li class="my-16">On macOS, you need to go to System Network Settings and change the System DNS to a public IP address, such as 8.8.8.8, to allow the kernel to hijack DNS requests.</li>
            <li class="my-16">If you encounter network connectivity issues, try using a different TUN stack mode.</li>
          </ul>
        </div>
      </div>

      <div v-if="currentStep === 5" class="flex flex-col gap-8">
        <div class="text-32 py-8 font-bold">Do you need to encrypt local DNS query requests?</div>
        <Tag>Prevent DNS query requests from being eavesdropped on or tampered with. DoH service is unavailable in some regions; please change servers or disable it.</Tag>
        <div class="flex gap-8">
          <Card @click="isDohEnabled = true" :selected="isDohEnabled" title="Required" class="flex-1" selected subtitle="Use Encrypted (DoH) DNS Query" />
          <Card @click="isDohEnabled = false" :selected="!isDohEnabled" title="Not Required" class="flex-1" subtitle="Do not use Encrypted DNS Query" />
        </div>
      </div>

      <div v-if="currentStep === 6" class="flex flex-col gap-8">
        <div class="text-32 py-8 font-bold">Do you need to enable Fake-IP mode?</div>
        <Tag>When enabled, DNS queries for some websites will return fake IPs. Usually, fake-IPs are returned for websites that require proxying.</Tag>
        <div class="flex gap-8">
      <Card @click="isFakeIPEnabled = true" :selected="isFakeIPEnabled" title="Required" class="flex-1" selected subtitle="Proxied websites return fake-IPs" />
      <Card @click="isFakeIPEnabled = false" :selected="!isFakeIPEnabled" title="Not Required" class="flex-1" subtitle="All websites return real IPs" />
        </div>
      </div>

      <div v-if="currentStep === 7" class="flex flex-col gap-8">
        <div class="text-32 py-8 font-bold">Should QUIC be disabled?</div>
        <Tag>Some websites use the QUIC protocol, which usually affects the speed of accessing proxy websites.</Tag>
        <div class="flex gap-8">
          <Card @click="isBanQUICEnabled = true" :selected="isBanQUICEnabled" title="Required" class="flex-1" selected subtitle="Block websites from using QUIC to avoid affecting proxy speed" />
          <Card @click="isBanQUICEnabled = false" :selected="!isBanQUICEnabled" title="Not Required" class="flex-1" subtitle="Allow websites to use the QUIC protocol" />

         </div>
      </div>

      <div v-if="currentStep === 8" class="flex flex-col gap-8">
        <div class="text-32 py-8 font-bold">Now, want to configure this to reference one or more subscriptions?</div>
        <p>点击下方+lick the + sign below, enter the subscription name on the left, and the subscription link on the right. Or, we'll talk about it later~</p>
        <KeyValueEditor v-model="subsMap" :placeholder="['subscription name', 'remote subscription link']" />
        <template v-if="subs.length > 0">
          <p>Wow! You've added some subscriptions, check them to reference them directly!</p>
          <div class="grid grid-cols-3 gap-8">
            <Card v-for="sub in subs" :key="sub.id" :title="sub.name" @click="toggleSubRef(sub)" :selected="subsRef.includes(sub)" />
          </div>
        </template>
        <p v-if="Object.keys(subsMap).length + subsRef.length > 1">If you intend to reference multiple subscriptions, these subscriptions may contain nodes with the same name, causing core startup to fail. However, you can find solutions in the Plugin Center.</p>
      </div>
    </div>
    `,
      setup() {
        const subscribeStore = Plugins.useSubscribesStore()

        const subs = computed(() => subscribeStore.subscribes.map((v) => ({ name: v.name, id: v.id })))

        return {
          currentStep,
          isSupportIPv6,
          isDirectIPv6Enabled,
          isProxyIPv6Enabled,
          isAllowLanEnabled,
          lanPort,
          isTUNEnabled,
          isDohEnabled,
          isFakeIPEnabled,
          isBanQUICEnabled,
          subsMap,
          subsRef,
          subs,
          name,
          toggleSubRef(sub) {
            const idx = subsRef.value.indexOf(sub)
            if (idx === -1) {
              subsRef.value.push(sub)
            } else {
              subsRef.value.splice(idx, 1)
            }
          }
        }
      }
    }

    const modal = Plugins.modal(
      {
        title: Plugin.name,
        width: '90',
        height: '90',
        maskClosable: true,
        submitText: 'Finish',
        afterClose() {
          modal.destroy()
        },
        async onOk() {
          const profilesStore = Plugins.useProfilesStore()
          const subscribeStore = Plugins.useSubscribesStore()

          // 1、导入订阅
          const subIds = []
          for (const [name, url] of Object.entries(subsMap.value)) {
            const sub = subscribeStore.getSubscribeTemplate(name, { url })
            await subscribeStore.addSubscribe(sub)
            await Plugins.sleep(1000)
            subIds.push({ name, id: sub.id })
          }

          // 2、导入配置
          const profile = profilesStore.getProfileTemplate(name.value)
          ;[...subIds, ...subsRef.value].forEach(({ name, id }) => {
            if (Plugins.APP_TITLE.includes('SingBox')) {
              profile.outbounds[0].outbounds.push({ id: id, tag: name, type: 'Subscription' })
              profile.outbounds[1].outbounds.push({ id: id, tag: name, type: 'Subscription' })
            } else if (Plugins.APP_TITLE.includes('Clash')) {
              profile.proxyGroupsConfig[0].use.push(id)
              profile.proxyGroupsConfig[1].use.push(id)
            }
          })

          // 3、个性化配置
          personalizeProfile(profile, {
            isDirectIPv6Enabled: isDirectIPv6Enabled.value,
            isProxyIPv6Enabled: isProxyIPv6Enabled.value,
            isAllowLanEnabled: isAllowLanEnabled.value,
            lanPort: lanPort.value,
            isTUNEnabled: isTUNEnabled.value,
            isDohEnabled: isDohEnabled.value,
            isFakeIPEnabled: isFakeIPEnabled.value,
            isBanQUICEnabled: isBanQUICEnabled.value
          })

          await profilesStore.addProfile(profile)
          Plugins.message.success('Done~')
        }
      },
      {
        default: () => h(component),
        action: () =>
          h('div', { class: 'mr-auto' }, [
            h(
              resolveComponent('Button'),
              {
                type: 'text',
                disabled: currentStep.value < 1,
                onClick: () => (currentStep.value -= 1)
              },
              () => 'Previous step'
            ),
            h(
              resolveComponent('Button'),
              {
                type: 'text',
                disabled: currentStep.value >= 8,
                onClick: () => (currentStep.value += 1)
              },
              () => 'Next step'
            )
          ])
      }
    )

    modal.open()
  }

  return { onRun, onReady, onDispose }
}

const getRandomUA = () => {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
    'Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) AppleWebKit/534.16 (KHTML, like Gecko) Chrome/10.0.648.133 Safari/534.16',
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/534.57.2 (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0',
    'Mozilla/5.0 (X11; U; Linux x86_64; zh-CN; rv:1.9.2.10) Gecko/20100922 Ubuntu/10.10 (maverick) Firefox/3.6.10'
  ]
  return userAgents[Math.floor(Math.random() * userAgents.length)]
}

const checkIPv6Support = async () => {
  try {
    const { status } = await Plugins.HttpGet('https://ipv6.lookup.test-ipv6.com/ip/', {
      'User-Agent': getRandomUA()
    })
    return status === 200
  } catch (error) {
    console.log(`[${Plugin.name}]`, 'IPv6 detection failed', error)
    return false
  }
}

const personalizeProfile = async (profile, options) => {
  if (Plugins.APP_TITLE.includes('SingBox')) {
    if (options.isDirectIPv6Enabled) {
      profile.dns.rules[0].strategy = 'prefer_ipv6'
      profile.dns.rules[3].strategy = 'prefer_ipv6'
    } else {
      profile.dns.rules[0].strategy = 'ipv4_only'
      profile.dns.rules[3].strategy = 'ipv4_only'
      profile.inbounds[1].tun.address.pop()
    }

    if (options.isProxyIPv6Enabled) {
      profile.dns.strategy = 'prefer_ipv6'
      profile.dns.rules[1].strategy = 'prefer_ipv6'
      profile.dns.rules[4].strategy = 'prefer_ipv6'
      profile.dns.rules[5].strategy = 'prefer_ipv6'
    } else {
      profile.dns.strategy = 'ipv4_only'
      profile.dns.rules[1].strategy = 'ipv4_only'
      profile.dns.rules[4].strategy = 'ipv4_only'
      profile.dns.rules[5].strategy = 'ipv4_only'
    }

    profile.inbounds[0].mixed.listen.listen = options.isAllowLanEnabled ? '0.0.0.0' : '127.0.0.1'
    if (options.lanPort) {
      profile.inbounds[0].mixed.listen.listen_port = Number(options.lanPort)
    }
    if (!options.isDohEnabled) {
      profile.dns.servers[1].type = 'udp'
      profile.dns.servers[1].server_port = '53'
      profile.dns.servers[1].path = ''
    }
    profile.inbounds[1].enable = options.isTUNEnabled
    profile.dns.rules[4].enable = options.isFakeIPEnabled
    profile.route.rules[6].enable = options.isBanQUICEnabled
  } else if (Plugins.APP_TITLE.includes('Clash')) {
    profile.generalConfig.ipv6 = options.isDirectIPv6Enabled || options.isProxyIPv6Enabled
    profile.dnsConfig.ipv6 = options.isDirectIPv6Enabled || options.isProxyIPv6Enabled

    if (!options.isDirectIPv6Enabled) {
      profile.dnsConfig['nameserver-policy']['rule-set:GEOSITE-CN'] += '&disable-ipv6=true'
    }
    if (!options.isProxyIPv6Enabled) {
      profile.dnsConfig['nameserver-policy']['rule-set:geolocation-!cn'] += '&disable-ipv6=true'
    }

    if (!options.isDohEnabled) {
      profile.dnsConfig['nameserver-policy']['rule-set:GEOSITE-CN'] = profile.dnsConfig['nameserver-policy']['rule-set:GEOSITE-CN'].replace(
        'https://223.5.5.5/dns-query',
        'udp://223.5.5.5'
      )
    }
    profile.generalConfig['allow-lan'] = options.isAllowLanEnabled
    if (options.lanPort) {
      profile.generalConfig['mixed-port'] = Number(options.lanPort)
    }
    profile.tunConfig.enable = options.isTUNEnabled
    if (options.isFakeIPEnabled) {
      profile.dnsConfig['enhanced-mode'] = 'fake-ip'
      profile.dnsConfig.nameserver = ['https://223.5.5.5/dns-query#' + profile.proxyGroupsConfig[2].name]
      profile.dnsConfig['fake-ip-filter'].push('rule-set:GEOSITE-CN')
    }
    profile.rulesConfig[1].enable = options.isBanQUICEnabled
  }
}