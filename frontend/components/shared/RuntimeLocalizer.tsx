"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { translateRuntimeText } from "@/lib/runtime-translations";

const TRANSLATED_ATTRIBUTES = ["placeholder", "title", "aria-label", "alt"] as const;
const SKIP_SELECTOR = [
  "[data-no-localize]",
  "script",
  "style",
  "code",
  "pre",
  "svg",
  "canvas",
  "textarea",
].join(",");

function shouldSkipNode(node: Node): boolean {
  const element =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;

  return Boolean(element?.closest(SKIP_SELECTOR));
}

export function RuntimeLocalizer() {
  const { locale } = useI18n();
  const originalText = useRef<WeakMap<Text, string>>(new WeakMap());
  const applying = useRef(false);

  useEffect(() => {
    const translateTextNode = (node: Text) => {
      if (shouldSkipNode(node)) {
        return;
      }

      const current = node.nodeValue ?? "";
      if (!current.trim()) {
        return;
      }

      const storedSource = originalText.current.get(node);
      const source = storedSource ?? current;
      const translated = translateRuntimeText(source, locale);

      if (!storedSource && translated === current) {
        return;
      }

      if (!storedSource) {
        originalText.current.set(node, source);
      }

      if (translated !== current) {
        node.nodeValue = translated;
      }
    };

    const translateElementAttributes = (element: Element) => {
      if (element.closest(SKIP_SELECTOR)) {
        return;
      }

      TRANSLATED_ATTRIBUTES.forEach((attribute) => {
        const current = element.getAttribute(attribute);
        if (!current?.trim()) {
          return;
        }

        const dataName = `data-i18n-original-${attribute}`;
        const storedSource = element.getAttribute(dataName);
        const source = storedSource ?? current;

        const translated = translateRuntimeText(source, locale);
        if (!storedSource && translated === current) {
          return;
        }

        if (!storedSource) {
          element.setAttribute(dataName, source);
        }

        if (translated !== current) {
          element.setAttribute(attribute, translated);
        }
      });
    };

    const translateSubtree = (root: Node) => {
      if (shouldSkipNode(root)) {
        return;
      }

      if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root as Text);
        return;
      }

      if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) {
        return;
      }

      if (root.nodeType === Node.ELEMENT_NODE) {
        translateElementAttributes(root as Element);
      }

      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        {
          acceptNode(node) {
            return shouldSkipNode(node)
              ? NodeFilter.FILTER_REJECT
              : NodeFilter.FILTER_ACCEPT;
          },
        },
      );

      let node = walker.nextNode();
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          translateTextNode(node as Text);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          translateElementAttributes(node as Element);
        }

        node = walker.nextNode();
      }
    };

    const translateBody = () => {
      applying.current = true;
      translateSubtree(document.body);
      applying.current = false;
    };

    translateBody();

    const observer = new MutationObserver((mutations) => {
      if (applying.current) {
        return;
      }

      applying.current = true;

      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          translateSubtree(mutation.target);
          return;
        }

        if (mutation.type === "attributes") {
          translateSubtree(mutation.target);
          return;
        }

        mutation.addedNodes.forEach((node) => translateSubtree(node));
      });

      applying.current = false;
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATED_ATTRIBUTES],
    });

    return () => observer.disconnect();
  }, [locale]);

  return null;
}
