import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

import { render, screen, waitFor } from '@testing-library/react';
import user  from '@testing-library/user-event'

import { act } from 'react-dom/test-utils'

describe("Act why and when without", () => {
  describe("update state in useEffect", () => {
    const ComponentWithUseEffect = () => {
      const [ count, setCount ] = useState(0)
      useEffect(() => {
        setCount(1)
      }, [])

      return <div>{count}</div>;
    }

    test('update state in useEffect', () => {
      const el = document.createElement("div");
      ReactDOM.render(<ComponentWithUseEffect />, el);

      expect(el.innerHTML).toBe("<div>1</div>");
    });

    test('solution: update state in useEffect', () => {
      const el = document.createElement("div");
      act(() => {
        ReactDOM.render(<ComponentWithUseEffect />, el);
      })

      expect(el.innerHTML).toBe("<div>1</div>");
    });

    test('rect-testing-library solution: update state in useEffect', async () => {
      render(<ComponentWithUseEffect />);
      expect(screen.getByText(1)).toBeInTheDocument();
    });
  });

  describe('update state with events', () => {
    const ComponentWithEvent = () => {
      const [ count, setCount ] = useState(0)
      const handleClick = () => setCount(count + 1)
      return <button onClick={handleClick}>{count}</button>;
    }

    test('update state with events', () => {
      const el = document.createElement("div");
      ReactDOM.render(<ComponentWithEvent />, el);

      const button = el.querySelector("button");

      button.click();
      button.click();

      //No need event is in react callstack
      expect(button.innerHTML).toBe("2");
    });

    test('rect-testing-library solution: update state with events', async () => {
      render(<ComponentWithEvent />);

      const button = screen.getByRole('button');

      user.click(button);
      user.click(button);

      expect(screen.getByText(2)).toBeInTheDocument();
    });
  })

  describe("update state in timers", () => {
    const ComponentWithTimer = () => {
      const [ count, setCount ] = useState(0)
      useEffect(() => {
        setCount(count + 1)
        setTimeout(() => {
          setCount((count) => count + 1)
        }, 500)

      }, [])

      return <div>{count}</div>;
    }

    test('update state in timers', () => {
      const el = document.createElement("div");
      ReactDOM.render(<ComponentWithTimer />, el);

      expect(el.innerHTML).toBe("<div>1</div>");
    });

    test('solution: update state in timers', async () => {
      jest.useFakeTimers();

      const el = document.createElement("div");
      act(() => {
        ReactDOM.render(<ComponentWithTimer />, el);
      })
      expect(el.innerHTML).toBe("<div>1</div>");

     act(() => {
        jest.runAllTimers();
     })

      expect(el.innerHTML).toBe("<div>2</div>");
    });

    test('react-testing-library solution: update state in timers', async () => {
      render(<ComponentWithTimer />)

      expect(screen.getByText(1)).toBeInTheDocument();
      expect(await screen.findByText(2)).toBeInTheDocument();
    });
  })

  describe("update state with await/async ", () => {
    const ComponentWithFetch = ({fetch}) => {
      let [count, setCount] = useState(0);

      const fetchData = async () => {
        const data = await fetch("/some/url");
        setCount(data)
      }

      useEffect(() => {
        fetchData()
      }, []);
      return <div>{count}</div>;
    }

    test('update state with await/async', () => {
      let resolve;
      const fetch = () => {
        return new Promise(_resolve => {
          resolve = _resolve;
        });
      };

      const el = document.createElement("div");
      act(() => {
        ReactDOM.render(<ComponentWithFetch fetch={fetch}/>, el);
      });

      expect(el.innerHTML).toBe("<div>0</div>");

      resolve(1)
      expect(el.innerHTML).toBe("<div>1</div>");
    })

    test('solution: update state with await/async', async () => {
      let resolve;
      const fetch = () => {
        return new Promise(_resolve => {
          resolve = _resolve;
        });
      };

      const el = document.createElement("div");
      act(() => {
        ReactDOM.render(<ComponentWithFetch fetch={fetch}/>, el);
      });

      expect(el.innerHTML).toBe("<div>0</div>");

      await act(async () => {
        resolve(1)
      })
      expect(el.innerHTML).toBe("<div>1</div>");
    })

    test('react-testing-library solution: update state with await/async', async () => {
      let resolve;
      const fetch = () => {
        return new Promise(_resolve => {
          resolve = _resolve;
        });
      };

     render(<ComponentWithFetch fetch={fetch}/>)

      expect(screen.getByText(0)).toBeInTheDocument();

      resolve(1)

      expect(await screen.findByText(1)).toBeInTheDocument();
    })
  })
})

describe("waitFor vs findBy", () => {
  const Component = ({fetchPageText}) => {
    const [ page, setPage ] = useState(1)
    const [ text, setText ] = useState("")

    const handleFetch = async () => {
      const data = await  fetchPageText(page);
      setText(data);
    }

    useEffect(() => {
      handleFetch();
    }, [page])

    return (
        <>
          <article>
            <p>{text}</p>
          </article>
          <button onClick={() => setPage((page) => page + 1)}>Next page</button>
        </>
    )
  }

  test("waitFor", async () => {
    const fetchPageText = jest.fn(async () => "Hello world")

    render(<Component fetchPageText={fetchPageText}/>)

    const button = screen.getByRole('button', {name: /Next page/i})

    user.click(button);

    await waitFor(() => {
      expect(fetchPageText).toHaveBeenCalledWith(2)
    })
    expect(fetchPageText).toHaveBeenCalledTimes(2);
  })

  test("findBy", async () => {
    const fetchPageText = jest.fn(() => "Hello world")

    render(<Component fetchPageText={fetchPageText}/>)

    const button = screen.getByRole('button', {name: /Next page/i})

    user.click(button);

    expect(await screen.findByText('Hello world' )).toBeInTheDocument();
  })

  test("empty waitFor working", () => {
    const fetchPageText = jest.fn(async () => "Hello world")

    render(<Component fetchPageText={fetchPageText}/>)

    const button = screen.getByRole('button', {name: /Next page/i})

    user.click(button);

    waitFor(() => { })
    expect(fetchPageText).toHaveBeenCalledWith(2)
    expect(fetchPageText).toHaveBeenCalledTimes(2);
  })

  test("side effect in waitFor", async () => {
    const fetchPageText = jest.fn( () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 100)
      })
    })

    render(<Component fetchPageText={fetchPageText}/>)

    const button = screen.getByRole('button', {name: /Next page/i})

    await waitFor(() => {
      user.click(button)
      expect(fetchPageText).toHaveBeenCalledWith(4)
    })

    expect(fetchPageText).toHaveBeenCalledTimes(2);
  })
})

describe("queryBy vs getBy vs findBy", () => {
  test("getBy", () => {
    const Component = ({value}) => {
      return <div>{value}</div>
    }

    render(<Component value={1}/>)

    expect(screen.getByText(2)).not.toBeInTheDocument();
  })

  test("queryBy and findBy", async () => {
    const Component = () => {
      const [ value, setValue ] = useState(1)
      useEffect(() => {
        setTimeout(() => {
          setValue(5)
        }, 100)
      }, [])

      return <div>{value}</div>
    }

    render(<Component />)

    expect(await screen.findByText(5)).toBeInTheDocument();
    expect(screen.queryByText(1)).not.toBeInTheDocument();
  })
})