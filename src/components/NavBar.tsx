import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import styles from '../styles/appStyles';

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

const NavItem = ({ id, icon: Icon, isActive, onPress }: { id: string; icon: IconType; isActive: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.navItem}>
    <Icon size={24} color={isActive ? "#22d3ee" : "#475569"} strokeWidth={isActive ? 2.5 : 2} />
    {isActive && <View style={styles.navItemIndicator} />}
  </TouchableOpacity>
);

const NavBar = ({ activeTab, items, onChange }: NavBarProps) => {
  return (
    <View style={styles.navBar}>
      {items.map((item) => (
        <NavItem
          key={item.id}
          id={item.id}
          icon={item.icon}
          isActive={activeTab === item.id}
          onPress={() => onChange(item.id)}
        />
      ))}
    </View>
  );
};

export default NavBar;

