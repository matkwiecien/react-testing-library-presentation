const wait = () => {
    return new Promise(resolve => {
        resolve();
    });
};
export const CalculatorCreator = () => {
    return {
        sum: 0,
        async asyncSum(a, b) {
            await wait();
            this.sum = a + b
            return this.sum;
        },
        sumWithSideEffect(a, b) {
          this.asyncSum(a, b);
        }
    }
}