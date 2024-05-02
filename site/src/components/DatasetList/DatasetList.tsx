import {
  useCurrentSidebarCategory,
  filterDocCardListItems,
} from "@docusaurus/theme-common";
import { useDocById } from "@docusaurus/theme-common/internal";
import Heading from "@theme/Heading";
import Link from "@docusaurus/Link";
import { ReactNode } from "react";
import clsx from "clsx";
import styles from "./DatasetList.styles.module.css";

type DatasetProps = {
  docId: string;
  label: string;
  href: string;
  tags?: string[];
};

const Dataset = ({ docId, label, href }: DatasetProps) => {
  try {
    const doc = useDocById(docId);
    const [description, applications] = doc.description.split(
      "Useful applications include"
    );
    const tags: string[] = applications
      ? applications.split(",").map((tag) => tag.trim().replace(/\.$/, ""))
      : [];
    return <CardLayout {...{ title: label, href, description, tags }} />;
  } catch (e) {
    console.log("error trying to render Dataset component for docId=" + docId);
    return null;
  }
};

const CategoryDataset = ({ label, href }: any) => {
  if (!href || !label) {
    console.warn("CategoryDataset got unexpected props");
    return null;
  }
  const docId = href.split("/")[2];
  return <Dataset {...{ label, href, docId }} />;
};

const cardItem = (item: any): item is DatasetProps =>
  !!item.label && !!item.docId && !!item.href;

export const DatasetList = () => {
  const category = useCurrentSidebarCategory();
  const items = filterDocCardListItems(category.items);
  return (
    <div>
      {items.map((item, i) =>
        cardItem(item) ? (
          <Dataset key={item.docId} {...item} />
        ) : (
          <CategoryDataset key={`cat-${i}`} {...item} />
        )
      )}
    </div>
  );
};

function CardLayout({
  href,
  title,
  description,
  tags,
}: {
  href: string;
  title: string;
  description?: string;
  tags: string[];
}): JSX.Element {
  return (
    <CardContainer href={href}>
      <div className={styles.cardHeader}>
        <div>
          <CardIcon tags={tags} />
        </div>
        <Heading
          as="h2"
          className={clsx("text--truncate", styles.cardTitle)}
          title={title}
        >
          {title}
        </Heading>
      </div>
      {description && (
        <p className={clsx(styles.cardDescription)} title={description}>
          {description}
        </p>
      )}
      {!!tags.length && (
        <div className={styles.cardTags}>
          <div className={styles.cardTagIntro}>Useful for:</div>
          <div className={styles.cardTagCell}>
            {tags.map((tag) => (
              <div key={tag} className={styles.cardTag}>
                {tag}
              </div>
            ))}
          </div>
        </div>
      )}
    </CardContainer>
  );
}

function CardIcon({ tags }: { tags: string[] }) {
  if (tags.includes("time series")) {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3.5 18.49L9.5 12.48L13.5 16.48L22 6.92001L20.59 5.51001L13.5 13.48L9.5 9.48001L2 16.99L3.5 18.49Z"
          fill="var(--ifm-color-primary)"
        />
      </svg>
    );
  }

  if (tags.includes("search")) {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V6H20V18ZM4 0H20V2H4V0ZM4 22H20V24H4V22ZM12 12C13.38 12 14.5 10.88 14.5 9.5C14.5 8.12 13.38 7 12 7C10.62 7 9.5 8.12 9.5 9.5C9.5 10.88 10.62 12 12 12ZM12 8.5C12.55 8.5 13 8.95 13 9.5C13 10.05 12.55 10.5 12 10.5C11.45 10.5 11 10.05 11 9.5C11 8.95 11.45 8.5 12 8.5ZM17 15.99C17 13.9 13.69 13 12 13C10.31 13 7 13.9 7 15.99V17H17V15.99ZM8.81 15.5C9.42 14.98 10.84 14.5 12 14.5C13.17 14.5 14.59 14.98 15.2 15.5H8.81Z"
          fill="var(--ifm-color-primary)"
        />
      </svg>
    );
  }

  if (tags.includes("counters")) {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19.88 17.97C20.32 17.27 20.58 16.46 20.58 15.58C20.58 13.09 18.57 11.08 16.08 11.08C13.59 11.08 11.58 13.09 11.58 15.58C11.58 18.07 13.59 20.08 16.07 20.08C16.95 20.08 17.77 19.82 18.46 19.38L21.58 22.5L23 21.08L19.88 17.97ZM16.08 18.08C14.7 18.08 13.58 16.96 13.58 15.58C13.58 14.2 14.7 13.08 16.08 13.08C17.46 13.08 18.58 14.2 18.58 15.58C18.58 16.96 17.46 18.08 16.08 18.08ZM15.72 9.58C14.98 9.6 14.27 9.76 13.62 10.03L13.07 9.2L9.27 15.38L6.26 11.86L2.63 17.67L1 16.5L6 8.5L9 12L13 5.5L15.72 9.58ZM18.31 10.08C17.67 9.8 16.98 9.63 16.26 9.59L21.38 1.5L23 2.68L18.31 10.08Z"
          fill="var(--ifm-color-primary)"
        />
      </svg>
    );
  }

  return null;
}

function CardContainer({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <Link
      href={href}
      className={clsx("card padding--md", styles.cardContainer)}
    >
      {children}
    </Link>
  );
}
