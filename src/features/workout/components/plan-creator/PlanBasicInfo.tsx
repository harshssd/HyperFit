import React from 'react';
import { Text, TextInput } from 'react-native';
import { text, spacing } from '../../../../styles/theme';
import { labelStyle, inputStyle } from './styles';

type PlanBasicInfoProps = {
  name: string;
  description: string;
  onChangeName: (v: string) => void;
  onChangeDescription: (v: string) => void;
};

/**
 * Plan-level name + description inputs at the top of the SlimPlanCreator.
 * Two simple controlled inputs; the parent owns the strings.
 */
const PlanBasicInfo = ({ name, description, onChangeName, onChangeDescription }: PlanBasicInfoProps) => (
  <>
    <Text style={labelStyle}>NAME</Text>
    <TextInput
      testID="plan-creator-name-input"
      value={name}
      onChangeText={onChangeName}
      placeholder="My plan"
      placeholderTextColor={text.quaternary}
      style={inputStyle}
    />

    <Text style={[labelStyle, { marginTop: spacing.md }]}>DESCRIPTION</Text>
    <TextInput
      testID="plan-creator-description-input"
      value={description}
      onChangeText={onChangeDescription}
      placeholder="What is this plan about?"
      placeholderTextColor={text.quaternary}
      multiline
      style={[inputStyle, { minHeight: 60, textAlignVertical: 'top' }]}
    />
  </>
);

export default PlanBasicInfo;
