<template>
  <div class="textarea-container">
    <label v-if="label" :for="id" class="textarea-label">{{ label }}</label>
    <textarea
      :id="id"
      v-model="content"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      class="textarea-input"
      @input="emitInput"
    ></textarea>
    <div v-if="showCharCount" class="char-count">
      {{ content.length }} / {{ maxLength }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Enter text here...'
  },
  label: {
    type: String,
    default: ''
  },
  rows: {
    type: Number,
    default: 4
  },
  disabled: {
    type: Boolean,
    default: false
  },
  maxLength: {
    type: Number,
    default: 1000
  },
  showCharCount: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const id = `textarea-${Math.random().toString(36).substr(2, 9)}`
const content = ref(props.modelValue)

const emitInput = () => {
  if (content.value.length <= props.maxLength) {
    emit('update:modelValue', content.value)
  } else {
    content.value = content.value.substring(0, props.maxLength)
  }
}
</script>

<style scoped>
.textarea-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.textarea-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.textarea-input {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.textarea-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.textarea-input:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.char-count {
  font-size: 12px;
  color: #999;
  text-align: right;
}
</style>
