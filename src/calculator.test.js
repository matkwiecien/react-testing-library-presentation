import { CalculatorCreator } from './calculator'


jest.useFakeTimers()

test('test', async () => {
    const calculator = CalculatorCreator();

    const result = await calculator.asyncSum(2, 2)
    expect(result).toBe(4);
});

test('CalculatorCreator', async () => {
    const calculator = await CalculatorCreator();

    calculator.sumWithSideEffect(2, 2);

    await jest.runAllTimers();

    expect(calculator.sum).toBe(4);
});