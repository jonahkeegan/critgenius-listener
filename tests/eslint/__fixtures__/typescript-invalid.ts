const unusedValue = 42;

function expectString(text: string) {
  return text.length;
}

export function runUnsafe(input: any) {
  const callResult = input();
  const member = input.value;
  const assigned: number = input;
  expectString(JSON.parse('{"data":"value"}'));
  expectString(input);
  return member + callResult + assigned;
}

export function parseUnknown(value: unknown) {
  const raw: any = value;
  const length = expectString(raw);
  return runUnsafe(raw) + length;
}

export function returnUnsafe(): number {
  const data: any = JSON.parse('{"value":1}');
  return data;
}

runUnsafe(() => 1);
parseUnknown({});
returnUnsafe();
