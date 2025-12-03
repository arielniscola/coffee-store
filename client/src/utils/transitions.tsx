import React, {
  useRef,
  useEffect,
  useContext,
  ReactNode,
  FC,
  RefObject,
  ElementType,
  HTMLAttributes,
} from "react";
import { CSSTransition as ReactCSSTransition } from "react-transition-group";

interface CSSTransitionProps extends HTMLAttributes<HTMLElement> {
  show?: boolean;
  enter?: string;
  enterStart?: string;
  enterEnd?: string;
  leave?: string;
  leaveStart?: string;
  leaveEnd?: string;
  appear?: boolean;
  unmountOnExit?: boolean;
  tag?: ElementType;
  children?: ReactNode;
}

interface TransitionProps extends CSSTransitionProps {
  show: boolean;
  appear?: boolean;
}

interface TransitionContextType {
  parent: {
    appear?: boolean;
    isInitialRender?: boolean;
    show?: boolean;
  };
}

const TransitionContext = React.createContext<TransitionContextType>({
  parent: {},
});

const useIsInitialRender = () => {
  const isInitialRender = useRef(true);
  useEffect(() => {
    isInitialRender.current = false;
  }, []);
  return isInitialRender.current;
};

const CSSTransition: FC<CSSTransitionProps> = ({
  show,
  enter = "",
  enterStart = "",
  enterEnd = "",
  leave = "",
  leaveStart = "",
  leaveEnd = "",
  appear,
  unmountOnExit,
  tag = "div",
  children,
  ...rest
}) => {
  const enterClasses = enter.split(" ").filter((s) => s.length);
  const enterStartClasses = enterStart.split(" ").filter((s) => s.length);
  const enterEndClasses = enterEnd.split(" ").filter((s) => s.length);
  const leaveClasses = leave.split(" ").filter((s) => s.length);
  const leaveStartClasses = leaveStart.split(" ").filter((s) => s.length);
  const leaveEndClasses = leaveEnd.split(" ").filter((s) => s.length);
  const removeFromDom = unmountOnExit;

  function addClasses(node: HTMLElement, classes: string[]) {
    classes.length && node.classList.add(...classes);
  }

  function removeClasses(node: HTMLElement, classes: string[]) {
    classes.length && node.classList.remove(...classes);
  }

  const nodeRef: RefObject<HTMLElement> = useRef<HTMLElement>(null);
  const Component = tag;

  return (
    <ReactCSSTransition
      appear={appear}
      nodeRef={nodeRef}
      unmountOnExit={removeFromDom}
      in={show}
      addEndListener={(done: any) => {
        if (nodeRef.current)
          nodeRef.current.addEventListener("transitionend", done, false);
      }}
      onEnter={() => {
        if (!removeFromDom && nodeRef.current) {
          nodeRef.current.style.display = "";
          addClasses(nodeRef.current, [...enterClasses, ...enterStartClasses]);
        }
      }}
      onEntering={() => {
        if (nodeRef.current) {
          removeClasses(nodeRef.current, enterStartClasses);
          addClasses(nodeRef.current, enterEndClasses);
        }
      }}
      onEntered={() => {
        if (nodeRef.current) {
          removeClasses(nodeRef.current, [...enterEndClasses, ...enterClasses]);
        }
      }}
      onExit={() => {
        if (nodeRef.current) {
          addClasses(nodeRef.current, [...leaveClasses, ...leaveStartClasses]);
        }
      }}
      onExiting={() => {
        if (nodeRef.current) {
          removeClasses(nodeRef.current, leaveStartClasses);
          addClasses(nodeRef.current, leaveEndClasses);
        }
      }}
      onExited={() => {
        if (nodeRef.current) {
          removeClasses(nodeRef.current, [...leaveEndClasses, ...leaveClasses]);
          if (!removeFromDom && nodeRef.current)
            nodeRef.current.style.display = "none";
        }
      }}
    >
      <Component
        ref={nodeRef}
        {...rest}
        style={{ display: !removeFromDom ? "none" : undefined }}
      >
        {children}
      </Component>
    </ReactCSSTransition>
  );
};

const Transition: FC<TransitionProps> = ({ show, appear, ...rest }) => {
  const context = useContext(TransitionContext);
  const isInitialRender = useIsInitialRender();
  const isChild = show === undefined;
  if (!context) {
    throw new Error(
      "Transition must be used within a TransitionContextProvider"
    );
  }
  const { parent } = context;

  if (isChild) {
    return (
      <CSSTransition
        appear={parent.appear || !parent.isInitialRender}
        show={parent.show}
        {...rest}
      />
    );
  }

  return (
    <TransitionContext.Provider
      value={{
        parent: {
          show,
          isInitialRender,
          appear,
        },
      }}
    >
      <CSSTransition appear={appear} show={show} {...rest} />
    </TransitionContext.Provider>
  );
};

export default Transition;
