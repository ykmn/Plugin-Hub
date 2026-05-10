const SourceCodePath = 'data/.cache/sing-box-stable'


const onRun = async () => {
  const component = {
    template: `
<div class="pr-8">
<Tabs v-model:active-key="currentKey" :items="tabs" tabPosition="top">
<template #1>
<Card title="Go environment" :selected="!!go_version">
<div> sing-box is written in Go, and this environment is essential.
</div>
<div v-if="go_version">
Detected: {{ go_version }}
</div>
<div v-else class="flex flex-col p-8">
<div class="flex items-center gap-8">
<Button @click="recheckGoVersion(true)" type="link" class="ml-auto">
Recheck environment
</Button>
<Button @click="goUrl" type="link">
Click to install
</Button>
</div>
</div>
</Card>
</template>
<template #2>
<Card title="Download Source Code">
<div class="flex flex-col">
<div>Note: This plugin currently only supports compilation of the stable branch.</div> </div>
<div v-if="source_code">
<div>You have downloaded the source code file. Click the button below to download the latest source code again</div>
</div>
<div class="flex flex-col p-8">
<Button @click="downloadMain" type="link">
{{ source_code_status || 'Download Source Code' }}
</Button>
</div>
</div>
</Card>
</template>
<template #3>
<Card title="Version Number">
<Input v-model="compile_version" placeholder="For example: 1.14.0" class="w-full" />
</Card>
<Card title="Feature Support" class="mt-8">
<div class="flex flex-col gap-4">
<div v-for="tag in singbox_tags" :key="tag.value" class="flex items-center">
<div>
<div> <div class="text-18">{{ tag.value }}</div>
<div class="text-12">{{ tag.label }}</div>
</div>
<div class="ml-auto">
<Switch :modelValue="enabled_tags.has(tag.value)" @change="v => v ? enabled_tags.add(tag.value) : enabled_tags.delete(tag.value)" />
</div>
</div>
</div>
</Card>
<Card title="Compilation Optimization" class="mt-8">
<div class="flex items-center">
<div>
<div class="text-18">-trimpath</div>
<div class="text-12">Delete local path (improves security and consistency)</div>
</div>
<div class="ml-auto">
<Switch v-model="compile_option_trimpath" />
</div>
</div> <div class="flex items-center mt-8">
<div>
<div class="text-18">-ldflags "-s -w"</div>
<div class="text-12">Remove symbol table and debugging information, significantly reducing size</div>
</div>
<div class="ml-auto">
<Switch v-model="compile_option_ldflags" />
</div>
</div>
<div class="flex items-center mt-8">
<div>
<div class="text-18">CGO_ENABLED=1</div>
<div class="text-12">Enable CGO (may be required for certain features)</div>
</div>
<div class="ml-auto">
<Switch v-model="compile_option_cgo_enabled" />
</div>
</div>
</Card>
</template>
<template #4>
<div class="flex items-center <gap-8">
<Button @click="startCompile(true)">
Recompile
</Button>
<Button @click="startCompile()" type="primary" class="flex-1">
{{ compile_running ? 'Compiling...' : 'Start compiling' }}
</Button>
<Button @click="openDist">
Open directory
</Button>
</div>
<Card class="mt-8">
<Empty v-if="compile_output.length === 0" class="py-32" />
<div v-else class="flex flex-col text-12 overflow-auto" style="height: 300px">
<div v-for="out in compile_output" :key="out">{{ out }}</div>
</div>
</Card>
</template>
</Tabs>
</div>
`,
    setup() {
      const { ref, computed, onMounted } = Vue


      const currentKey = ref('1')
      const tabs = [

        { key: '1', tab: '1. Compilation Environment' },

        { key: '2', tab: '2. Source Code Download' },

        { key: '3', tab: '3. Core Customization' },

        { key: '4', tab: '4. Start Compiling' }

      ]


      const enabled_tags = ref(
        new Set([
          // 'with_quic',
          // 'with_dhcp',
          // 'with_wireguard',
          'with_utls',
          // 'with_acme',
          'with_clash_api',
          'with_gvisor'
          // 'with_tailscale',
          // 'with_ccm',
          // 'with_ocm',
          // 'with_naive_outbound',
          // 'badlinkname',
          // 'tfogo_checklinkname0',
        ])
      )
      const singbox_tags = [
        {
          label: 'Enable QUIC support (for Hysteria, TUIC, HTTP3 DNS, Naive inbound, etc.)',
          value: 'with_quic'
        },
        {
          label: 'Enable standard gRPC support (for V2Ray transport, etc.)',
          value: 'with_grpc'
        },
        {
          label: 'Enable DHCP support (for DHCP DNS transport)',
          value: 'with_dhcp'
        },
        {
          label: 'Enable WireGuard protocol support',
          value: 'with_wireguard'
        },
        {
          label: 'Enable uTLS support (for TLS outbound fingerprint emulation)',
          value: 'with_utls'
        },
        {
          label: 'Enable ACME certificate request support (for automated TLS)',
          value: 'with_acme'
        },
        {
          label: 'Enable... Clash API Support (for supporting external control panels)',
          value: 'with_clash_api'
        },

        {
          label: 'Enable V2Ray API Support (experimental feature)',
          value: 'with_v2ray_api'
        },

        {
          label: 'Enable gVisor Support (for Tun inbound and WireGuard outbound network stack)',
          value: 'with_gvisor'
        },

        {
          label: 'Enable Built-in Tor Support (requires CGO environment)',
          value: 'with_embedded_tor'
        },

        {
          label: 'Enable Tailscale Support (for use as a Tailscale endpoint)',
          value: 'with_tailscale'
        },

        {
          label: 'Enable Claude Code Multiplexer (CCM) Service Support',
          value: 'with_ccm'
        },

        {
          label: 'Enable OpenAI Codex Multiplexer (OCM) Service Support',
          value: 'with_ocm'
        },

        {
          label: 'Enable NaiveProxy Outbound Support',
          value: 'with_naive_outbound'
        },

        {
          label: 'Enable badlinkname (allows access to internal standard library functions for low-level operations such as kTLS)',
          value: 'badlinkname'
        },

        {
          label: 'Enable tfogo_checklinkname0 (used to bypass linkname restrictions in Go 1.23+)',
          value: 'tfogo_checklinkname0'
        },

        {
          label: 'Use purego implementation (pure Go calls system libraries, reducing CGO dependencies)',
          value: 'with_purego'
        }
      ]


      const compile_running = ref(false)
      const compile_output = ref([])
      const compile_args = computed(() => {
        const args = []


        // 1. 添加 trimpath
        if (compile_option_trimpath.value) {
          args.push('-trimpath')
        }


        // 2. 处理 Tags
        const tags = Array.from(enabled_tags.value)
        if (tags.length) {
          args.push('-tags', tags.join(','))
        }


        // 3. 构建 ldflags
        let ldflagsParts = []
        if (compile_option_ldflags.value) {
          ldflagsParts.push('-s', '-w', '-buildid=')
        }
        // 注入版本号
        ldflagsParts.push(`-X github.com/sagernet/sing-box/constant.Version=${compile_version.value || 'unknown'}`)


        args.push('-ldflags', ldflagsParts.join(' '))


        return args
      })
      const compile_version = ref('')
      const compile_option_trimpath = ref(true)
      const compile_option_ldflags = ref(true)
      const compile_option_cgo_enabled = ref(false)


      const source_code = ref()
      const source_code_status = ref()


      function recheckSourceCode() {
        Plugins.FileExists('data/.cache/sing-box-source-code.zip').then((res) => {
          source_code.value = res
        })
      }


      const go_version = ref()
      function recheckGoVersion(showTips) {
        Plugins.Exec('go', ['version'])
          .then((v) => {
            go_version.value = v
          })
          .catch(() => {
            if (showTips) {
              Plugins.alert('Prompt', 'If you have it installed but the environment cannot be detected, please restart this program')

            }
          })
      }


      onMounted(() => {
        recheckGoVersion()
        recheckSourceCode()
      })


      return {
        currentKey,
        tabs,
        go_version,
        recheckGoVersion,
        source_code,
        source_code_status,
        singbox_tags,
        enabled_tags,
        compile_args,
        compile_version,
        compile_option_trimpath,
        compile_option_ldflags,
        compile_option_cgo_enabled,
        compile_output,
        compile_running,
        goUrl() {
          Plugins.OpenURI('https://go.dev/dl/')
        },
        async downloadMain() {
          if (source_code_status.value) return
          source_code_status.value = '下载中...'
          await Plugins.Download(
            'https://github.com/SagerNet/sing-box/archive/refs/heads/stable.zip',
            'data/.cache/sing-box-source-code.zip',
            undefined,
            (p) => {
              source_code_status.value = Plugins.formatBytes(p)
            }
          ).finally(() => {
            source_code_status.value = ''
            recheckSourceCode()
          })
          await Plugins.RemoveFile(SourceCodePath)
          Plugins.UnzipZIPFile('data/.cache/sing-box-source-code.zip', 'data/.cache')
        },
        openDist() {
          Plugins.OpenDir(SourceCodePath)
        },
        async startCompile(force) {
          if (compile_running.value) return
          compile_running.value = true
          await Plugins.sleep(1000)
          const abs_path = await Plugins.AbsolutePath(SourceCodePath)
          await Plugins.ExecBackground(
            'go',
            ['build', '-v', ...(force ? ['-a'] : []), ...compile_args.value, './cmd/sing-box'],
            (out) => {
              compile_output.value.unshift(out)
            },
            async () => {
              const dir = await Plugins.ReadDir(SourceCodePath)
              if (dir.some((file) => file.name.startsWith('sing-box'))) {
                compile_output.value.unshift('-'.repeat(120))
                compile_output.value.unshift('Compilation complete, core file path：' + SourceCodePath + '/sing-box*')
                compile_output.value.unshift('-'.repeat(120))
              }
            },
            {
              Env: {
                CGO_ENABLED: compile_option_cgo_enabled.value ? '1' : '0'
              },
              Convert: true,
              WorkingDirectory: abs_path
            }
          )
            .catch((err) => {
              compile_output.value.unshift(err.message || err)
            })
            .finally(() => {
              compile_running.value = false
            })
        }
      }
    }
  }
  const modal = Plugins.modal(
    {
      title: Plugin.name,
      submit: false,
      width: '90',
      height: '90',
      cancelText: 'common.close',
      afterClose() {
        modal.destroy()
      }
    },
    {
      default: () => Vue.h(component)
    }
  )
  modal.open()
}
