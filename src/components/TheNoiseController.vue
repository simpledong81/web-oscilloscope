<script setup lang="ts">
import RangeController from '@/components/RangeController.vue';

import { computed } from 'vue';
import { oscStore } from '@/store';

const store = oscStore();
const noiseLevelValue = computed<number>({
  get(): number {
    return store.noiseLevel;
  },
  set(value: number) {
    store.noiseLevel = value;
  },
});
</script>

<template>
  <fieldset class="controller">
    <legend v-once>
      ノイズ
    </legend>
    <RangeController
      v-model:value="noiseLevelValue"
      :controller-id="`noiseLevel`"
      :controller-label="`レベル`"
      :max="30"
      :min="0"
    />
  </fieldset>
</template>
