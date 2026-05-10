/** @type {EsmPlugin} */
export default (Plugin) => {
  /**
   * Plugin hook - When the run button is clicked
   */
  const onRun = async () => {
    const profile = await selectProfile()
    openUI(profile)
    return 0
  }

  const addRelayProxy = async (profile) => {
    openUI(profile)
  }

  const openUI = async (profile) => {
    const { ref, h, computed, watch } = Vue
    const outTags = await getOutTags(profile)
    const component = {
      template: `
<div class="pr-8">
<div class="py-8 flex items-center gap-4">
Quick Add: To
<Select v-model="targetChainIndex" :options="chainOptions" />
Add Outbound
<Select v-model="globalOutSelected" :options="outList" placeholder="Select Outbound Tags" />
<Button @click="addOutToTargetChain" type="link">Execute Now</Button>
<Button @click="relayConfigGenerate" type="primary" class="ml-auto">Generate Final Script</Button>
</div>
<!-- Multiple Chain Area -->
<div class="flex flex-col gap-8 mt-8">
<Card v-for="(chain, idx) in relayChains" :key="idx" :title="'The ' + (idx+1) + 'th proxy chain'">
<template #title-suffix>
<div v-if="relayChains[idx].length < 2" class="text-12 px-8" style="color: #ff6b6b">Requires at least 2 outbounds</div>
</template>
<template #extra>
<Button @click="() => removeChain(idx)" v-if="relayChains.length > 1" type="text" size="small">Remove</Button>
</template>
<InputList v-model="relayChains[idx]" placeholder="Outbound" class="w-full" />
</Card>
</div>
<div class="mt-8">
<Button @click="addChain" type="text" class="w-full" icon="add">Add proxy chain</Button>
</div>
<div class="text-12 flex flex-col gap-4 py-16" style="color: #5c5c5c"> <div>Please add the outbound or packet you want to include in the proxy chain, with traffic flowing from top to bottom.</div>
<div>If you specify an upstream for a packet, an upstream will be added to all non-packet outbound connections within the packet.</div>
<div>If you need to add multiple proxy chains, please use the "Add Proxy Chain" button above; each chain forms a group.</div>
</div>
</div>
    `,
      setup() {
        // 每条链是数组
        const relayChains = ref([[]])
        const outList = outTags.map((v) => ({ label: v, value: v }))

        // 全局 select
        const globalOutSelected = ref(outList[0]?.value ?? null)
        // 目标链索引（选择插入到哪条链）
        const targetChainIndex = ref(0)

        // 生成链下拉选项：链 1, 链 2, ...
        const chainOptions = computed(() =>
          relayChains.value.map((_, i) => ({
            label: `the ${i + 1}th proxy chain`,
            value: i
          }))
        )

        // 当链数变化时，确保 targetChainIndex 在有效范围
        watch(
          relayChains,
          () => {
            if (targetChainIndex.value >= relayChains.value.length) {
              targetChainIndex.value = relayChains.value.length - 1
            }
          },
          { deep: true }
        )

        const addChain = () => {
          relayChains.value.push([])
          // 自动把 target 设为最后一条（便于快速添加）
          targetChainIndex.value = relayChains.value.length - 1
        }

        const removeChain = (idx) => {
          if (relayChains.value.length <= 1) return
          relayChains.value.splice(idx, 1)
          if (targetChainIndex.value >= relayChains.value.length) {
            targetChainIndex.value = relayChains.value.length - 1
          }
        }

        // 将全局选中的出站插入到目标链（尾部）
        const addOutToTargetChain = () => {
          if (!globalOutSelected.value) return
          const idx = Number(targetChainIndex.value || 0)
          if (idx < 0 || idx >= relayChains.value.length) return
          relayChains.value[idx].push(globalOutSelected.value)
        }

        // 规范化每条链
        const normalizeChains = (chains) => chains.map((chain) => (chain || []).map((v) => (typeof v === 'string' ? v.trim() : v)).filter(Boolean))

        // 对每条链反转
        const handleRelayChains = (chains) => chains.map((c) => c.slice().reverse())

        // 生成逻辑：对每条链单独校验最少出站
        const relayConfigGenerate = async () => {
          const normalized = normalizeChains(relayChains.value)

          // 每条链单独校验
          for (let i = 0; i < normalized.length; i++) {
            if (normalized[i].length < 2) {
Plugins.message.error(`The ${i+1}th chain requires at least 2 outgoing links (current ${normalized[i].length})`)
throw `Insufficient outgoing links for the ${i+1}th chain`
            }
          }

          const reversedChains = handleRelayChains(normalized)
          const configScript = generateConfigScript(reversedChains)
          displayConfigScript(profile, configScript)
        }

        if (relayChains.value.length > 0) targetChainIndex.value = 0

        return {
          relayChains,
          outList,
          globalOutSelected,
          targetChainIndex,
          chainOptions,
          addChain,
          removeChain,
          addOutToTargetChain,
          relayConfigGenerate
        }
      }
    }

    const modal = Plugins.modal(
      {
        title: 'Chained proxy list',
        submit: false,
        width: '90',
        cancelText: 'close',
        afterClose: () => {
          modal.destroy()
        }
      },
      {
        default: () => h(component)
      }
    )

    modal.open()
  }

  const displayConfigScript = (profile, configScript) => {
    const profilesStore = Plugins.useProfilesStore()
    const { ref, h } = Vue
    const previewComponent = {
      template: `
<div class="pr-8">
<Card>
<div class="flex justify-between items-start gap-12 rounded px-12 py-8">
<div class="flex-1" style="line-height: 1.5">
You can click the <b>Copy Script</b> button on the right to copy the script to your clipboard, and then paste it into the corresponding configuration's
"Settings → Mixins and Scripts → Script Actions" section, or click the
<b>Overwrite</b> button on the right to directly overwrite the script into the current configuration.
</div>
<div style="flex:0 0 auto; display:flex; flex-direction:column; gap:6px;">
<Button @click="onCopy" type="primary" title="Copy script to clipboard">
Copy script
</Button>
<Button @click="onOverWrite" type="link" title="Clicking will directly overwrite the currently configured script in the proxy chain">
Overwrite
</Button>

</div>
</div>
<CodeViewer v-model="code" lang="javascript" style="min-height:320px; width:100%; border-radius:6px; overflow:hidden;"
</Card>
</div>
          `,
      setup() {
        const code = ref(configScript)

        const onOverWrite = async () => {
          profile.script.code = configScript
          profilesStore.editProfile(profile.id, profile)
Plugins.message.info('The proxy chain script has been successfully written to the current configuration')

}

const onCopy = async () => {
await Plugins.ClipboardSetText(code.value)

Plugins.message.info('The script has been copied to the clipboard')
        }

        return {
          code,
          onOverWrite,
          onCopy
        }
      }
    }

    const modal = Plugins.modal(
      {
title: 'Configure Script Preview',

submit: false,

cancelText: 'Close',
        afterClose: () => {
          modal.destroy()
        }
      },
      {
        default: () => h(previewComponent)
      }
    )
    modal.open()
  }

  const generateConfigScript = (relayChainsArg) => {
    const escape = (s) => String(s).replace(/'/g, "\\'")
    const relayChainsStr = '[' + relayChainsArg.map((chain) => '[' + chain.map((v) => `'${escape(v)}'`).join(', ') + ']').join(', ') + ']'

    // 支持为分组内实际 outbounds 添加上游
 const configScript = ` const relayChains = ${relayChainsStr}; // Proxy chain definition

const excludeReg = /selector|urltest/; // Exclude group type

const outsMap = Object.fromEntries(config.outbounds.map((out) => [out.tag, out])); // Convert all outbound requests to a map with tag as the key

/ Identify the actual outbound members contained in the group

const groupMembers = {};

for (const out of Object.values(outsMap)) {

/ Only process valid outbound requests that are of the group type

if (!out?.tag || !excludeReg.test(out.type)) continue;

const membersSet = new Set();

for (const candidate of Object.values(outsMap)) {

/ Only process valid outbound requests that are not themselves

if (!candidate?.tag || candidate.tag === out.tag) continue;

try {

/ Determine if a candidate is a group member based on JSON string inclusion relationships

if (JSON.stringify(out).includes('"' + candidate.tag + '"')) {

membersSet.add(candidate.tag);

}

} catch (e) {

/ Ignore serialization errors, they do not affect the logic

}
}
groupMembers[out.tag] = Array.from(membersSet);

}

/ Traverse the proxy chain and set the upstream outgoing node

relayChains.forEach((chain) => {

chain.forEach((tag, i, arr) => {

/ The last outgoing node of the chain does not need to set the upstream

if (i === arr.length - 1) return;

const out = outsMap[tag];

const upStream = arr[i + 1]; // The next outgoing node is the upstream of the current outgoing node

if (!out) {

throw \`Error: No outgoing node \${tag}\` found in the current configuration

}

/ Process according to the outgoing node type

if (excludeReg.test(out.type)) { // If it's a group type (selector or urltest)

const members = groupMembers[tag] || [];

// Check if the group has recognized members

if (!members.length) {

throw \`Error: No available member was found for group \${tag}, please check the configuration\`;

}
members.forEach((mTag) => {

// If the member itself is the upstream, skip it to avoid a self-loop

if (mTag === upStream) {

Plugins.message.warn(\`Warning: The upstream of member \${mTag} in group \${tag} is the same as itself, the setting has been skipped.\`);

return;

}

const mOut = outsMap[mTag];

if (!mOut) {

throw \`Error: No outbound \${mTag} (belonging to group \${tag}) was found in the current configuration\`;

}
// Set the upstream only for members that are not grouped and are not of type 'direct' or 'block'.

if (!excludeReg.test(mOut.type) && !['direct', 'block'].includes(mOut.type)) {

mOut.detour = upStream;

}
});

} else { // If it is a normal outbound type

/ // Exclude 'direct' and 'block' types, they cannot have their upstream set.

if (['direct', 'block'].includes(out.type)) {

throw \`Error: Outbound ${out.tag} type cannot have its upstream set\`;

}
/ // The upstream of a normal outbound type cannot be itself.

if (tag === upStream) {

throw \`Error: The upstream of outbound ${out.tag} cannot be itself. Please check the proxy chain configuration. \`;

}
out.detour = upStream;

}
});

});`

    return `const onGenerate = async (config) => {
${configScript}
  return config
}`.replace(/^\s*$(?:\r\n?|\n)/gm, '')
  }

  const selectProfile = async () => {
    const profilesStore = Plugins.useProfilesStore()
    let profile
    if (profilesStore.profiles.length === 1) {
      profile = profilesStore.profiles[0]
    } else {
      profile = await Plugins.picker.single(
        'Please select the configuration to add the proxy chain to.',
        profilesStore.profiles.map((v) => ({
          label: v.name,
          value: v
        })),
        [profilesStore.profiles[0]]
      )
    }
    return profile
  }

  const getOutTags = async (profile) => {
    const config = await Plugins.generateConfig(profile)
    const outTags = config.outbounds.flatMap((out) => {
      if (!['direct', 'block'].includes(out.type) && out.tag !== 'GLOBAL') {
        return out.tag
      }
      return []
    })
    return outTags
  }

  return { onRun, addRelayProxy }
}
