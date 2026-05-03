import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { palette, text, spacing, radii } from '../../../../styles/theme';
import type { SessionExercise } from '../../../../types/workout';
import NumField from './NumField';
import { inputStyle } from './styles';

type SessionExerciseEditorProps = {
  exercise: SessionExercise;
  onUpdate: (patch: Partial<SessionExercise>) => void;
  onRemove: () => void;
};

/**
 * One row of the session editor: editable name + sets / min reps / max reps
 * / rest seconds, plus a remove button. Pure presentation; the parent owns
 * the session-level array updates.
 */
const SessionExerciseEditor = ({ exercise, onUpdate, onRemove }: SessionExerciseEditorProps) => (
  <View style={{ marginBottom: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: palette.borderSubtle, borderRadius: radii.sm }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <TextInput
        value={exercise.name}
        onChangeText={(v) => onUpdate({ name: v })}
        placeholder="Exercise name"
        placeholderTextColor={text.quaternary}
        style={[inputStyle, { flex: 1, marginRight: spacing.sm, marginBottom: 0 }]}
      />
      <TouchableOpacity onPress={onRemove} accessibilityLabel="Remove exercise">
        <X size={16} color={text.quaternary} />
      </TouchableOpacity>
    </View>
    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
      <NumField label="SETS" value={exercise.sets} onChange={(n) => onUpdate({ sets: n })} />
      <NumField label="MIN" value={exercise.repRange.min} onChange={(n) => onUpdate({ repRange: { ...exercise.repRange, min: n } })} />
      <NumField label="MAX" value={exercise.repRange.max} onChange={(n) => onUpdate({ repRange: { ...exercise.repRange, max: n } })} />
      <NumField label="REST" value={exercise.restSeconds || 0} onChange={(n) => onUpdate({ restSeconds: n })} />
    </View>
  </View>
);

export default SessionExerciseEditor;
