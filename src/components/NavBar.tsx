import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navbarStyles } from '../styles';
import { accent, text } from '../styles/theme';

type IconType = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type NavItemConfig = {
  id: string;
  label: string;
  icon: IconType;
};

type NavBarProps = {
  activeTab: string;
  items: NavItemConfig[];
  onChange: (id: string) => void;
};

const NavItem = ({
  label,
  icon: Icon,
  isActive,
  onPress,
}: {
  label: string;
  icon: IconType;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={navbarStyles.navItem}
    accessibilityRole="tab"
    accessibilityLabel={label}
    accessibilityState={{ selected: isActive }}
    hitSlop={8}
  >
    <Icon
      size={24}
      color={isActive ? accent.lift : text.disabled}
      strokeWidth={isActive ? 2.5 : 2}
    />
    {isActive && <View style={navbarStyles.navItemIndicator} />}
  </TouchableOpacity>
);

const NavBar = ({ activeTab, items, onChange }: NavBarProps) => {
  // Bottom safe-area inset lifts icons above the home indicator on iPhones.
  // Without this the nav reads as "too low" because icons sit at the screen edge.
  // Floor at 8pt so Android (where insets.bottom is often 0) keeps a cushion.
  const insets = useSafeAreaInsets();
  const pad = insets.bottom > 0 ? insets.bottom : 8;
  return (
    <View
      style={[navbarStyles.navBar, { paddingBottom: pad }]}
      accessibilityRole="tablist"
    >
      {items.map(item => (
        <NavItem
          key={item.id}
          label={item.label}
          icon={item.icon}
          isActive={activeTab === item.id}
          onPress={() => onChange(item.id)}
        />
      ))}
    </View>
  );
};

export default NavBar;
