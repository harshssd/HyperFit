import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { navbarStyles } from '../styles';

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
    <Icon size={24} color={isActive ? '#22d3ee' : '#475569'} strokeWidth={isActive ? 2.5 : 2} />
    {isActive && <View style={navbarStyles.navItemIndicator} />}
  </TouchableOpacity>
);

const NavBar = ({ activeTab, items, onChange }: NavBarProps) => (
  <View style={navbarStyles.navBar} accessibilityRole="tablist">
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

export default NavBar;

