import { Text, TextInput, type ReturnKeyTypeOptions, type TextInputProps } from "react-native";
import { radius, space, type, useTheme } from "../theme";

interface Focusable {
  focus: () => void;
}

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
  onBind?: (node: Focusable | null) => void;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType,
  returnKeyType,
  onSubmitEditing,
  editable = true,
  autoFocus,
  onBind,
}: Props) {
  const theme = useTheme();
  return (
    <>
      <Text style={{ fontSize: type.caption, color: theme.muted, marginBottom: space.xs }}>{label}</Text>
      <TextInput
        ref={(node) => onBind?.(node)}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={!onSubmitEditing}
        editable={editable}
        autoFocus={autoFocus}
        accessibilityLabel={label}
        style={{
          backgroundColor: theme.card,
          borderWidth: 1,
          borderColor: theme.line,
          borderRadius: radius.input,
          paddingHorizontal: space.md,
          paddingVertical: space.md,
          fontSize: type.body,
          color: theme.ink,
          minHeight: 44,
        }}
      />
    </>
  );
}
