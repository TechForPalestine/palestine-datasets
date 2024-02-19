import { useEffect, useState } from "react";
import type { KilledInGaza } from "../../../../types/killed-in-gaza.types";
import clsx from "clsx";
import styles from "./KilledPersonSearchResult.styles.module.css";
import { PersonIcon } from "../KilledHeaderMarquee/PersonIcon";
import { iconTypeForPerson } from "../../lib/age-icon";
import { parseISO } from "date-fns/parseISO";
import { format } from "date-fns/format";
import { ExternalWindowIcon } from "../ExternalWindowIcon";

const fetchPerson = async (id: string): Promise<KilledInGaza | undefined> => {
  try {
    const response = await fetch(`/api/v2/killed-in-gaza/${id}.json`);
    if (!response.ok || response.status !== 200) {
      return;
    }

    return response.json();
  } catch (_) {
    // fail silent
  }
};

const fetchAllPeople = async (ids: string[]) => {
  const results = await Promise.all(ids.map((id) => fetchPerson(id)));
  const matches = results.filter((result) => !!result);
  return matches;
};

const formatName = (name: string) => {
  if (name.includes("?")) {
    return "Unknown Name";
  }

  return name;
};

const SearchSection = ({ children }) => (
  <section>
    <h3>Search Result</h3>
    {children}
  </section>
);

const correctionFormLink = ({
  recordId,
  arabicName,
  englishName,
  yyyymmddDob,
}: {
  recordId: string;
  arabicName: string;
  englishName: string;
  yyyymmddDob?: string;
}) =>
  `https://docs.google.com/forms/d/e/1FAIpQLSfYazQFosIuvMg5DiJri5oAKIc0aq3evz3_lHzxuLam59aj7Q/viewform?usp=pp_url&entry.1898888411=${encodeURIComponent(
    recordId
  )}&entry.284230456=${encodeURIComponent(
    englishName
  )}&entry.1695503817=${encodeURIComponent(arabicName)}${
    yyyymmddDob ? `&entry.1111739377=${yyyymmddDob}` : ""
  }`;

export const KilledPersonSearchResult = () => {
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<KilledInGaza[]>([]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const idsParam = url.searchParams.get("ids");
    if (idsParam) {
      setLoading(true);
      const ids = idsParam.split(",");
      fetchAllPeople(ids)
        .then((results) => setPeople(results))
        .finally(() => setLoading(false));
    }
  }, []);

  if (loading) {
    return <SearchSection>Loading...</SearchSection>;
  }

  if (!people.length) {
    return null;
  }

  return (
    <SearchSection>
      <div className="row">
        {people.map((person) => {
          const iconType = iconTypeForPerson(person.age, person.sex);
          let genderLabel: string = iconType;
          if (genderLabel.startsWith("elderly-")) {
            genderLabel = genderLabel.replace("elderly-", "senior ");
          }
          return (
            <div className={clsx("col col--12")} key={person.id}>
              <div className={styles.personCardContainer}>
                <div className={`card ${styles.personCard}`}>
                  <div className="card__body">
                    <div className={styles.personCardName}>
                      <PersonIcon type={iconType} />{" "}
                      {formatName(person.en_name)}
                    </div>
                    <div className={styles.personCardInnerPad}>
                      <div className={styles.personCardArabicName}>
                        {person.name}
                      </div>
                      {person.age >= 0 && (
                        <div className={styles.personCardAge}>
                          {person.age === 0
                            ? `less than 1 year old`
                            : `${person.age} year old ${genderLabel}`}
                        </div>
                      )}
                      {!!person.dob && (
                        <div>
                          Born {format(parseISO(person.dob), "MMMM do, yyyy")}
                        </div>
                      )}
                      <div className={styles.personCardLinkFooter}>
                        <a
                          href={`/api/v2/killed-in-gaza/${person.id}.json`}
                          target="_blank"
                        >
                          API Endpoint <ExternalWindowIcon />
                        </a>
                        <span
                          style={{ width: "20px", display: "inline-block" }}
                        />
                        <a
                          href={correctionFormLink({
                            recordId: person.id,
                            arabicName: person.name,
                            englishName: person.en_name,
                            yyyymmddDob: person.dob,
                          })}
                          target="_blank"
                        >
                          Suggest Correction <ExternalWindowIcon />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <hr />
    </SearchSection>
  );
};
