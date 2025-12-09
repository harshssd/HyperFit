import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Edit, RotateCcw, X, FileText, Trash2 } from 'lucide-react-native';
import GlassCard from '../../../components/GlassCard';
import NeonButton from '../../../components/NeonButton';
import { colors, spacing, radii } from '../../../styles/theme';
import { WorkoutPlan } from '../../../types/workout';

type PlanManagementMenuProps = {
  visible: boolean;
  activePlan: WorkoutPlan | undefined;
  onClose: () => void;
  onEditPlan: () => void;
  onChangePlan: () => void;
  onEndPlan: () => void;
  onCreateFromExisting: () => void;
};

const PlanManagementMenu = ({
  visible,
  activePlan,
  onClose,
  onEditPlan,
  onChangePlan,
  onEndPlan,
  onCreateFromExisting,
}: PlanManagementMenuProps) => {
  if (!visible || !activePlan) return null;

  const menuOptions = [
    {
      icon: Edit,
      label: 'Edit Current Plan',
      description: 'Modify sessions and schedule',
      action: onEditPlan,
      color: colors.primary,
    },
    {
      icon: RotateCcw,
      label: 'Change Plan',
      description: 'Switch to a different plan',
      action: onChangePlan,
      color: '#8b5cf6',
    },
    {
      icon: FileText,
      label: 'Create from Existing',
      description: 'Duplicate and customize a plan',
      action: onCreateFromExisting,
      color: '#06b6d4',
    },
    {
      icon: Trash2,
      label: 'End Plan',
      description: 'Archive this plan',
      action: onEndPlan,
      color: colors.danger,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
      }}>
        <GlassCard style={{
          width: '100%',
          maxWidth: 400,
          padding: spacing.xl,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.lg,
          }}>
            <View>
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: 4,
              }}>
                Manage Plan
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.muted,
              }}>
                {activePlan.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                padding: spacing.sm,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: radii.full,
              }}
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={{ gap: spacing.md }}>
            {menuOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  option.action();
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.md,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: radii.full,
                  backgroundColor: `${option.color}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.md,
                }}>
                  <option.icon size={20} color={option.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: 2,
                  }}>
                    {option.label}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: colors.muted,
                  }}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <NeonButton
            onPress={onClose}
            style={{
              marginTop: spacing.lg,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
              CANCEL
            </Text>
          </NeonButton>
        </GlassCard>
      </View>
    </Modal>
  );
};

export default PlanManagementMenu;
