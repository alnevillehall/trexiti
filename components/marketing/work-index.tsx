"use client";

import Link from "next/link";
import { useState } from "react";

import type {
  ProjectSummary,
  WorkFilter,
} from "@/lib/content/projects";

import { HomepageProjectVisual } from "./homepage-project-visual";
import styles from "@/app/(marketing)/work/work-page.module.css";

export function WorkIndex({
  filters,
  projects,
}: {
  filters: readonly WorkFilter[];
  projects: readonly ProjectSummary[];
}) {
  const [activeFilter, setActiveFilter] = useState<WorkFilter>("All");
  const visibleProjects =
    activeFilter === "All"
      ? projects
      : projects.filter((project) =>
          project.categories.includes(activeFilter),
        );

  return (
    <div>
      <div aria-label="Filter selected work" className={styles.filters}>
        {filters.map((filter) => (
          <button
            aria-pressed={activeFilter === filter}
            key={filter}
            onClick={() => setActiveFilter(filter)}
            type="button"
          >
            <span>{filter}</span>
            <span>{String(filter === "All" ? projects.length : projects.filter((project) => project.categories.includes(filter)).length).padStart(2, "0")}</span>
          </button>
        ))}
      </div>

      <p aria-live="polite" className={styles.filterStatus}>
        Showing {visibleProjects.length} project
        {visibleProjects.length === 1 ? "" : "s"} for {activeFilter}.
      </p>

      <div className={styles.projectGrid} role="list">
        {visibleProjects.map((project, index) => (
          <article
            className={`${styles.projectCard} ${
              index === 0 ? styles.projectCardLead : ""
            }`}
            key={project.slug}
            role="listitem"
          >
            <Link href={`/work/${project.slug}`}>
              <div className={styles.projectVisualWrap}>
                <HomepageProjectVisual project={project} />
              </div>
              <div className={styles.projectMeta}>
                <span>{project.industry}</span>
                <span>{project.year}</span>
              </div>
              <div className={styles.projectIdentity}>
                <div>
                  <span className={styles.conceptLabel}>
                    {project.evidence.label}
                  </span>
                  <h3>{project.title}</h3>
                  <p>{project.projectType}</p>
                </div>
                <span aria-hidden="true" className={styles.projectArrow}>
                  ↗
                </span>
              </div>
              <p className={styles.projectSummary}>{project.summary}</p>
              <div className={styles.projectCategories} aria-label="Categories">
                {project.categories.map((category) => (
                  <span key={category}>{category}</span>
                ))}
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
